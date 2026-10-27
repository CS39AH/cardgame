/* =========================================================
   SUBSTITUTE CHAOS — BATTLE EFFECTS
   Animations for the battle screen. Nothing in here changes
   the rules; it only shows what just happened.

   How it works: battle.js calls snapshot() at the start of
   render() (old screen still showing) and play() at the end
   (new screen drawn). We compare before and after and fly
   "ghost" copies of cards between the two.
   ========================================================= */

window.SC = window.SC || {};

(function () {
    'use strict';

    // ONE knob for all timing. 1 = original speed, 2 = twice as slow.
    const SLOW = 1.6;

    const CARD_W = 400;     // full card width before zoom
    const HAND_W = 240;     // hand cards are zoom 0.6 (see .hand-slot in styles.css)
    const INTENT_W = 180;   // intent cards are zoom 0.45
    const PILE_W = 144;     // 9rem pile cards

    // What the screen looked like after the last render
    let lastHand = [];
    let lastEnemySanity = 0;
    let lastPlayerSanity = 0;
    let lastPlayerRelax = 0;
    let lastEnemyRelax = 0;
    let lastFields = { enemy: [], player: [] };
    let lastFieldHp = { enemy: [], player: [] };   // each defender's Sanity at that moment
    let lastIntents = [];                           // the enemy's next card(s)
    let lastPowers = { enemy: [], player: [] };     // Power cards in play
    let nextKind = 'play';

    // ---------- Called from battle.js ----------

    // New fight: forget the old screen
    function reset(state) {
        clear();
        lastHand = [];
        lastEnemySanity = state.enemy.sanity;
        lastPlayerSanity = state.player.sanity;
        lastPlayerRelax = state.player.relaxation;
        lastEnemyRelax = state.enemy.relaxation;
        lastFields = { enemy: state.enemy.field.slice(), player: state.player.field.slice() };
        lastFieldHp = { enemy: state.enemy.field.map(hpOf), player: state.player.field.map(hpOf) };
        lastIntents = (state.enemy.next || []).slice();
        lastPowers = { enemy: (state.enemy.powers || []).slice(), player: (state.player.powers || []).slice() };
        nextKind = 'play';
    }

    // The next render is an End Turn, not a card play
    function mark(kind) {
        nextKind = kind;
    }

    // Grab positions + copies of cards BEFORE render() wipes them
    function snapshot() {
        const slots = Array.from(document.querySelectorAll('.battle__hand .hand-slot'));
        const intents = Array.from(document.querySelectorAll('.intent-slot'));

        return {
            hand: lastHand.map(function (card, i) {
                return grab(card, slots[i]);
            }),
            intents: intents.map(function (slot, i) {
                return grab(lastIntents[i] || null, slot);
            }),
            enemySanity: lastEnemySanity,
            playerSanity: lastPlayerSanity,
            playerRelax: lastPlayerRelax,
            enemyRelax: lastEnemyRelax,
            fields: { enemy: grabUnits('enemy'), player: grabUnits('player') },
            powers: { enemy: lastPowers.enemy.slice(), player: lastPowers.player.slice() }
        };
    }

    // Compare before vs now and animate the difference
    function play(before) {
        const state = SC.combat.state;
        const kind = nextKind;
        nextKind = 'play';

        const enemyLoss = before.enemySanity - state.enemy.sanity;
        const playerLoss = before.playerSanity - state.player.sanity;

        // Match old hand to new hand. Anything new was drawn,
        // anything missing left the hand (played or discarded).
        const slots = Array.from(document.querySelectorAll('.battle__hand .hand-slot'));
        const leftHand = before.hand.slice();
        const drawn = [];

        state.hand.forEach(function (card, i) {
            const j = leftHand.findIndex(function (old) { return old.card === card; });
            if (j >= 0) {
                leftHand.splice(j, 1);
            } else if (slots[i]) {
                drawn.push(slots[i]);
            }
        });

        remember(state);

        // Powers that went off during this action (Teacher's Pet, etc.).
        // Take them now so they only play once.
        const fires = state.powerFires || [];
        state.powerFires = [];
        const hits = state.hitLog || [];
        state.hitLog = [];

        if (reducedMotion()) {
            return;
        }

        // Hide drawn cards right away so they don't flash in early
        drawn.forEach(function (slot) {
            slot.style.visibility = 'hidden';
        });

        let enemyHitAt = 0;     // when the enemy side gets hit (for tearing)
        let heroHitAt = 0;      // when your side gets hit
        let cardLandAt = 0;     // when your played card reaches the table
        let enemyTearAt = null; // when knocked-out defenders rip (null = the usual time)
        let playerTearAt = null;

        if (kind === 'discard') {
            // End Turn: your leftover hand sweeps into the discard pile
            leftHand.forEach(function (old, k) {
                later(k * 70, function () { toDiscard(old); });
            });
        } else if (kind === 'enemyCard') {
            // An enemy card just LANDED (it already flew over): hits happen now
            const outcome = blockedOutcome(hitOutcome(before.fields.player, state.player.field), 'player');
            const landedCard = takeFlight();
            const guards = defenderDamage(before.fields.player, state.player.field, 'player');
            const split = splitPowerDamage(fires, 'enemy', guards, playerLoss);
            const cardHits = hits.filter(function (h) { return !h.fromPower && h.who === 'player'; });
            let doneAt = 0;

            if (cardHits.length > 1) {
                // "Deal 2 damage 3 times": it bobs back and jabs again for each hit
                const r = multiHit(cardHits, before.fields.player, state.player.field, 'player', '.battle__hero', landedCard);
                doneAt = r.lastAt;
                playerTearAt = r.lastDefenderAt + 150;
            } else {
                guards.forEach(function (g, k) {
                    if (g.loss > 0) later(k * 120, function () { hitDefender(g); });
                });

                // Anything left over after your defenders goes through to your hero
                if (split.cardLoss > 0) {
                    later(guards.length ? 250 : 0, function () { hit('.battle__hero', split.cardLoss); });
                }
                showRelaxHit(cardHits, '.battle__hero', split.cardLoss > 0 ? 250 : 0);
            }
            later(doneAt, function () { afterHit(outcome, landedCard); });
            blockHits(cardHits, 'player', doneAt);
            showPowerFires(fires, doneAt + 350, split.target);

            // The enemy healing or gaining Relaxation
            const enemyRelaxGain = state.enemy.relaxation - before.enemyRelax;
            if (enemyLoss < 0) {
                floatText('.battle__enemy', '+' + (-enemyLoss) + ' 🧠', 'fx-heal');
            }
            if (enemyRelaxGain > 0) {
                floatText('.battle__enemy', '+' + enemyRelaxGain + ' 😌', 'fx-relax');
            }
        } else {
            // You played a card. 'impact' = an attack that already flew
            // to its target, so its hits happen right now.
            const landed = kind === 'impact';
            const outcome = blockedOutcome(hitOutcome(before.fields.enemy, state.enemy.field), 'enemy');
            const landedCard = landed ? takeFlight() : null;

            leftHand.forEach(function (old) {
                const at = landed ? 0 : playedCard(old, enemyLoss);
                enemyHitAt = Math.max(enemyHitAt, at);
                cardLandAt = Math.max(cardLandAt, at);
            });

            // Enemy defenders soak up the hit first, then the enemy
            const enemyGuards = defenderDamage(before.fields.enemy, state.enemy.field, 'enemy');
            const split = splitPowerDamage(fires, 'player', enemyGuards, enemyLoss);
            const cardHits = hits.filter(function (h) { return !h.fromPower && h.who === 'enemy'; });
            let doneAt = Math.max(enemyHitAt, cardLandAt);

            if (landed && cardHits.length > 1) {
                // "Deal 2 damage 3 times": it bobs back and jabs again for each hit
                const r = multiHit(cardHits, before.fields.enemy, state.enemy.field, 'enemy', '.battle__enemy', landedCard);
                doneAt = r.lastAt;
                enemyTearAt = r.lastDefenderAt + 150;
            } else {
                enemyGuards.forEach(function (g, k) {
                    if (g.loss > 0) later(enemyHitAt + k * 120, function () { hitDefender(g); });
                });
                if (split.cardLoss > 0) {
                    later(enemyHitAt + (enemyGuards.length ? 250 : 0), function () {
                        hit('.battle__enemy', split.cardLoss);
                    });
                }
                showRelaxHit(cardHits, '.battle__enemy', enemyHitAt + (split.cardLoss > 0 ? 250 : 0));
            }
            if (landed) {
                later(doneAt, function () { afterHit(outcome, landedCard); });
                blockHits(cardHits, 'enemy', doneAt);
            }

            // Your Powers go off just after the card's last hit
            showPowerFires(fires, doneAt + 350, split.target);

            heroHitAt = landed ? 0 : (leftHand.length ? 650 : 0);
            if (playerLoss > 0) {
                later(heroHitAt, function () { hit('.battle__hero', playerLoss); });
            }

            // Healing and Relaxation from your own cards
            const relaxGain = state.player.relaxation - before.playerRelax;
            if (playerLoss < 0) {
                later(landed ? 150 : 500, function () {
                    floatText('.battle__hero', '+' + (-playerLoss) + ' 🧠', 'fx-heal');
                });
            }
            if (relaxGain > 0) {
                later(landed ? 250 : 700, function () {
                    floatText('.battle__hero', '+' + relaxGain + ' 😌', 'fx-relax');
                });
            }
        }

        // New defenders slam onto the table when their card gets there
        slamNewDefenders(before.fields.player, state.player.field, 'player', cardLandAt);
        slamNewDefenders(before.fields.enemy, state.enemy.field, 'enemy', heroHitAt);

        // New Power cards slam down too
        slamNewPowers(before.powers.player, state.player.powers, 'player', cardLandAt);
        slamNewPowers(before.powers.enemy, state.enemy.powers, 'enemy', heroHitAt);

        // Defenders that got knocked out rip in half where they stood
        tearKnockedOut(before.fields.enemy, state.enemy.field, 'enemy',
            enemyTearAt !== null ? enemyTearAt : enemyHitAt + 150);
        tearKnockedOut(before.fields.player, state.player.field, 'player',
            playerTearAt !== null ? playerTearAt : heroHitAt + 150);

        // Enemy beaten or you ran out of Sanity: that card rips in half
        if (before.enemySanity > 0 && state.enemy.sanity <= 0) {
            later(enemyHitAt + 200, function () {
                const el = document.querySelector('.battle__enemy .unit--enemy');
                if (el) tearApart(el);
            });
        }
        if (before.playerSanity > 0 && state.player.sanity <= 0) {
            later(heroHitAt + 200, function () {
                const el = document.querySelector('.battle__hero .hero-badge');
                if (el) tearApart(el);
            });
        }

        // New turn: deal new cards from the deck
        drawn.forEach(function (slot, k) {
            later(k * 110, function () { dealIn(slot); });
        });
    }

    // ---------- The animations ----------

    // Card leaves your hand: lift up, then go to its target.
    // Returns the moment (before SLOW) it lands.
    function playedCard(old, enemyLoss) {
        if (!old.node) return 0;

        const effects = old.card.effects || [];
        const isAttack = effects.some(function (e) { return e.type === 'damage'; });
        const isDefender = effects.some(function (e) { return e.type === 'defender'; });
        const isPower = old.card.type === 'Power';

        // Confiscated cards don't go to the discard pile
        if (effects.some(function (e) { return e.type === 'confiscate'; })) {
            confiscate(old);
            return 600;
        }

        let targetSel = '.pile--discard .pile__stack';
        let endW = PILE_W;
        let fade = false;

        if (isAttack && enemyLoss > 0) {
            targetSel = '.battle__enemy';
            endW = HAND_W * 0.6;
            fade = true;
        } else if (isDefender) {
            // Fly to the new defender's spot and slam down there
            const units = document.querySelectorAll('.battle__field--player > .unit');
            const spot = units[units.length - 1];
            if (spot) {
                return slamCardDown(old, spot);
            }
            targetSel = '.battle__field--player';
            endW = HAND_W * 0.7;
            fade = true;
        } else if (isPower) {
            // Fly to the new Power's spot and slam down there
            const powers = document.querySelectorAll('.battle__powers--player > .power-slot');
            const spot = powers[powers.length - 1];
            if (spot) {
                return slamCardDown(old, spot);
            }
            targetSel = '.battle__powers--player';
            endW = HAND_W * 0.7;
            fade = true;
        }

        const target = document.querySelector(targetSel);
        if (!target) return 0;

        const to = centerOf(target);
        const ghost = makeGhost(old.node, old.center, HAND_W);
        const dx = to.x - old.center.x;
        const dy = to.y - old.center.y;
        const endScale = endW / HAND_W;

        const duration = 700;

        ghost.animate([
            { transform: 'translate(0, 0) scale(1)', opacity: 1 },
            { transform: 'translate(0, -150px) scale(1.3)', opacity: 1, offset: 0.3 },
            { transform: 'translate(0, -150px) scale(1.3)', opacity: 1, offset: 0.5 },
            { transform: 'translate(' + dx + 'px, ' + dy + 'px) scale(' + endScale + ')', opacity: fade ? 0 : 1 }
        ], {
            duration: ms(duration),
            easing: 'cubic-bezier(.3, .7, .3, 1)',
            fill: 'forwards'
        }).finished.then(function () { ghost.remove(); });

        if (!fade) {
            flipToBack(ghost, duration, 0.6);
        }

        return Math.round(duration * 0.9);
    }

    // End of turn: a hand card slides into the discard pile
    function toDiscard(old) {
        if (!old.node) return;
        const target = document.querySelector('.pile--discard .pile__stack');
        if (!target) return;

        const ghost = makeGhost(old.node, old.center, HAND_W);
        flyGhost(ghost, old.center, centerOf(target), PILE_W / HAND_W, 420, -40);
        flipToBack(ghost, 420, 0.3);
    }

    // Enemy's intent card flies at your hero
    // ---------- Cards that fly BEFORE they take effect ----------
    // battle.js calls these, waits the time they return (real ms),
    // and only then changes the game. So damage, rips and numbers
    // all happen at the moment of impact.

    // The enemy's next card (index in its "Next turn it plays" row)
    function enemyCardFly(index) {
        const slot = document.querySelectorAll('.intent-slot')[index];
        const card = SC.combat.state.enemy.next[index];
        if (!slot || !card || reducedMotion()) return 0;

        const old = grab(card, slot);
        if (!old.node) return 0;

        const front = document.querySelector('.battle__field--player > .unit');
        const aimAt = aimFor(card, front ? centerOf(front) : null);

        const isAttack = (card.effects || []).some(function (e) { return e.type === 'damage'; });

        // Your blocking Powers (Track Record) jump in front first,
        // and the attack hits them instead
        const guardAt = isAttack && aimAt ? sendBlockers('player', old.center, aimAt) : null;

        slot.style.visibility = 'hidden';       // it left the row
        enemyAttack(old, guardAt || aimAt, isAttack);
        return ms(450);
    }

    // Your attack card from your hand, at the enemy's front defender or the enemy
    function attackFly(handIndex) {
        const slot = document.querySelectorAll('.battle__hand .hand-slot')[handIndex];
        const card = SC.combat.state.hand[handIndex];
        if (!slot || !card || reducedMotion()) return 0;

        const old = grab(card, slot);
        const target = document.querySelector('.battle__field--enemy > .unit') ||
            document.querySelector('.battle__enemy');
        if (!old.node || !target) return 0;

        slot.style.visibility = 'hidden';       // it left your hand
        if (SC.playSound) SC.playSound('whoosh');

        // The enemy's blocking Powers (Padded Walls) jump in front first
        const to = sendBlockers('enemy', old.center, centerOf(target)) || centerOf(target);
        const end = { x: to.x - old.center.x, y: to.y - old.center.y, scale: 0.75, rot: 8 };
        const ghost = makeGhost(old.node, old.center, HAND_W);
        const duration = 650;

        // Stays fully visible; afterHit() takes over when it lands
        ghost.animate([
            { transform: 'translate(0, 0) scale(1) rotate(0deg)', opacity: 1 },
            { transform: 'translate(0, -150px) scale(1.3) rotate(0deg)', opacity: 1, offset: 0.3 },
            { transform: 'translate(0, -150px) scale(1.3) rotate(0deg)', opacity: 1, offset: 0.45, easing: 'cubic-bezier(.6, 0, 1, .6)' },
            { transform: moveTo(end), opacity: 1 }
        ], { duration: ms(duration), fill: 'forwards' });

        flight = { ghost: ghost, end: end, from: old.center, home: '.pile--discard .pile__stack' };

        return ms(duration);
    }

    // ---------- Cards that hit more than once ----------

    // Longest the bobbing can take, so a big Bin Dump doesn't go on forever
    const BOB_MAX_TOTAL = 1600;

    // Shows each hit separately: the card bobs back and jabs again,
    // and every hit shows its own number (and clang on a defender).
    // Returns when the last hit lands, and the last hit on a defender.
    function multiHit(cardHits, beforeUnits, nowField, side, cardSel, landedCard) {
        const count = cardHits.length;
        const gap = Math.min(300, BOB_MAX_TOTAL / (count - 1));

        // Each defender's Sanity as the hits come in (front one first).
        // Their shields start back at the old number and count down.
        const els = Array.from(document.querySelectorAll('.battle__field--' + side + ' > .unit'));
        const units = (beforeUnits || []).map(function (old) {
            const i = nowField.indexOf(old.unit);
            const el = i === -1 ? null : els[i];
            if (el) setShield(el, old.sanity);
            return { hp: old.sanity, el: el, old: old, center: old.center };
        });

        if (landedCard) bobAttack(landedCard, count, gap);

        let lastDefenderAt = 0;
        cardHits.forEach(function (h, i) {
            const at = i * gap;

            if (h.defender > 0) {
                // The front defender still standing takes it
                const target = units.find(function (u) { return u.hp > 0; });
                let left = h.defender;
                units.forEach(function (u) {
                    const took = Math.min(u.hp, left);
                    u.hp -= took;
                    left -= took;
                });

                if (target) {
                    const hpNow = Math.max(0, target.hp);
                    later(at, function () {
                        // The defender, or the copy standing in for it if it's knocked out
                        const el = target.el || target.old.standIn;
                        const alive = el && document.body.contains(el) ? el : null;
                        if (alive) setShield(alive, hpNow);
                        hitDefender({ el: alive, center: target.center, loss: h.defender });
                    });
                    lastDefenderAt = at;
                }
            }

            if (h.sanity > 0) {
                later(at + (h.defender > 0 ? 80 : 0), function () {
                    if (!h.defender && SC.playSound) SC.playSound('slam');
                    hit(cardSel, h.sanity);
                });
            } else if (!h.defender) {
                later(at, function () {
                    if (SC.playSound) SC.playSound('slam');
                });
            }

            // Soaked up by Relaxation: a blue "-2 😌"
            if (h.relax > 0) {
                later(at + (h.sanity > 0 ? 150 : 0), function () {
                    floatText(cardSel, '-' + h.relax + ' 😌', 'fx-relax');
                });
            }
        });

        return { lastAt: (count - 1) * gap, lastDefenderAt: lastDefenderAt };
    }

    // A floating number at a point on the screen
    function floatAt(point, text, extraClass, color) {
        const num = document.createElement('div');
        num.className = 'fx-damage' + (extraClass ? ' ' + extraClass : '');
        num.textContent = text;
        if (color) num.style.color = color;
        num.style.left = point.x + 'px';
        num.style.top = point.y + 'px';
        document.body.appendChild(num);
        num.animate([
            { transform: 'translate(-50%, -50%) scale(0.5)', opacity: 0 },
            { transform: 'translate(-50%, -90%) scale(1.4)', opacity: 1, offset: 0.2 },
            { transform: 'translate(-50%, -250%) scale(1)', opacity: 0 }
        ], { duration: ms(950), easing: 'ease-out', fill: 'forwards' })
            .finished.then(function () { num.remove(); });
    }

    // A card's hits that Relaxation soaked up show as a blue "-3 😌"
    function showRelaxHit(cardHits, cardSel, at) {
        const relax = cardHits.reduce(function (total, h) { return total + (h.relax || 0); }, 0);
        if (relax > 0) {
            later(at, function () {
                floatText(cardSel, '-' + relax + ' 😌', 'fx-relax');
            });
        }
    }

    function setShield(el, value) {
        const shield = el.querySelector('.unit__shield');
        if (shield) shield.textContent = value;
    }

    // The attack card pulls back and jabs forward again, once per extra hit
    function bobAttack(f, count, gap) {
        const a = f.end;
        const length = Math.hypot(a.x, a.y) || 1;
        const dir = { x: a.x / length, y: a.y / length };
        const back = { x: a.x - dir.x * 45, y: a.y - dir.y * 45 - 12, scale: a.scale * 1.05, rot: a.rot - 10 };

        const frames = [{ transform: moveTo(a), offset: 0, easing: 'ease-out' }];
        for (let i = 1; i < count; i++) {
            frames.push({ transform: moveTo(back), offset: (i - 0.55) / (count - 1), easing: 'cubic-bezier(.6, 0, 1, .6)' });
            frames.push({ transform: moveTo(a), offset: i / (count - 1), easing: 'ease-out' });
        }

        hold(ms((count - 1) * gap + 200));
        f.ghost.animate(frames, { duration: ms((count - 1) * gap), fill: 'forwards' });
    }

    // ---------- Powers going off ----------

    // The engine already added a Power's damage into the totals.
    // Take it back out, so the card's hit and the Power's hit each
    // show their own number. Returns what's left for the card, and
    // where the Power's hit should land.
    //   who    = whose Powers went off ('player' or 'enemy')
    //   guards = the defenders that got hit (from defenderDamage)
    //   loss   = Sanity the enemy/hero lost in total
    function splitPowerDamage(fires, who, guards, loss) {
        let powerSanity = 0;
        let powerDefender = 0;
        fires.forEach(function (f) {
            if (f.who !== who) return;
            powerSanity += f.sanityLoss;
            powerDefender += f.defenderLoss;
        });

        // Damage goes to defenders front-first, and the Power hits after
        // the card, so the Power's share is at the back end. Take it off
        // from the back; the front-most defender it reached is its target.
        let left = powerDefender;
        let target = null;
        for (let i = guards.length - 1; i >= 0 && left > 0; i--) {
            const share = Math.min(guards[i].loss, left);
            guards[i].loss -= share;
            left -= share;
            target = guards[i];
        }

        const foeCard = who === 'player' ? '.battle__enemy' : '.battle__hero';
        return {
            cardLoss: loss - powerSanity,
            target: {
                defender: target,
                card: foeCard
            }
        };
    }

    // Each Power that went off: if it does damage, the Power card itself
    // jumps out, attacks the target, flies back and slams into its spot.
    // If it doesn't do damage (like Team Spirit), it just lights up.
    function showPowerFires(fires, at, target) {
        let t = at;
        fires.forEach(function (f) {
            const powers = SC.combat.state[f.who].powers;
            const slot = document.querySelectorAll('.battle__powers--' + f.who + ' > .power-slot')[powers.indexOf(f.card)];
            if (!slot) return;

            const toDefender = f.defenderLoss > 0 && target.defender;
            const amount = toDefender ? f.defenderLoss : f.sanityLoss;
            const relax = f.relaxLoss || 0;

            // Not an attacking Power (like Team Spirit): it just lights up
            if (!f.attacks && amount <= 0 && relax <= 0) {
                later(t, function () { pulsePower(slot); });
                t += 450;
                return;
            }

            hold(ms(t + POWER_ATTACK + 300));      // stay busy until it's back in its spot
            later(t, function () {
                // Did 0 damage (e.g. the enemy's Padded Walls blocked it all)?
                // It still attacks: the front defender if there is one, or the card
                const foeSide = f.who === 'player' ? 'enemy' : 'player';
                const blocked = amount <= 0 && relax <= 0;
                // (:not(.tear-half) skips a knocked-out defender that's still ripping apart)
                const frontDefender = document.querySelector('.battle__field--' + foeSide + ' > .unit:not(.tear-half)');
                let to;
                if (toDefender) {
                    to = target.defender.el && document.body.contains(target.defender.el)
                        ? centerOf(target.defender.el) : target.defender.center;
                } else if (blocked && frontDefender) {
                    to = centerOf(frontDefender);
                } else {
                    const el = document.querySelector(target.card);
                    if (!el) return;
                    to = centerOf(el);
                }

                powerAttack(slot, to, f.card.attackSounds || {}, function () {
                    if (blocked) {
                        // Nothing got through: a "0" where it hit
                        if (frontDefender && SC.playSound) SC.playSound('shieldHit');
                        floatAt(to, '0');
                    } else if (toDefender) {
                        hitDefender({ el: target.defender.el, center: to, loss: amount });
                    } else if (amount > 0) {
                        hit(target.card, amount);
                    }
                    // Soaked up by Relaxation: a blue "-1 😌"
                    if (relax > 0) {
                        later(amount > 0 ? 150 : 0, function () {
                            floatText(target.card, '-' + relax + ' 😌', 'fx-relax');
                        });
                    }
                });
            });
            t += POWER_ATTACK + 150;      // the next Power waits for this one
        });
    }

    const POWER_W = 200;        // Power cards on the table are 400px at zoom 0.5
    const POWER_ATTACK = 1000;  // how long a Power's whole attack takes (before SLOW)

    // The Power card jumps up, swoops at the target, bounces off,
    // flies back to its spot and slams down. onHit runs on impact.
    // sounds: the card's own { jump, hit } sounds (from cards.js), if it has them
    function powerAttack(slot, to, sounds, onHit) {
        const cardEl = slot.querySelector('.card');
        if (!cardEl) return;

        const from = centerOf(slot);
        const ghost = makeGhost(cardEl.cloneNode(true), from, POWER_W);
        ghost.classList.add('fly-ghost--power');
        slot.style.visibility = 'hidden';           // the real one left its spot

        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const HIT = 0.45;                            // when it reaches the target

        hold(ms(POWER_ATTACK + 300));
        if (SC.playSound) SC.playSound(sounds.jump || 'powerUp');

        ghost.animate([
            // jump up out of the Power spot
            { transform: 'translate(0, 0) scale(1) rotate(0deg)', easing: 'cubic-bezier(.2, .8, .3, 1)' },
            { transform: 'translate(0, -70px) scale(1.25) rotate(-6deg)', offset: 0.18, easing: 'cubic-bezier(.6, 0, 1, .6)' },
            // swoop in and hit
            { transform: 'translate(' + dx + 'px, ' + dy + 'px) scale(0.9) rotate(10deg)', offset: HIT, easing: 'cubic-bezier(.2, .8, .3, 1)' },
            // bounce back off it
            { transform: 'translate(' + (dx * 0.85) + 'px, ' + (dy * 0.85 - 30) + 'px) scale(1) rotate(-8deg)', offset: 0.58, easing: 'ease-in-out' },
            // fly home and hang above the spot...
            { transform: 'translate(0, -60px) scale(1.2) rotate(-4deg)', offset: 0.9, easing: 'cubic-bezier(.7, 0, 1, .5)' },
            // ...then SLAM back down
            { transform: 'translate(0, 0) scale(1) rotate(0deg)' }
        ], { duration: ms(POWER_ATTACK), fill: 'forwards' });

        later(POWER_ATTACK * HIT + 50, function () {     // +50: a hair after it touches
            if (sounds.hit && SC.playSound) SC.playSound(sounds.hit);
            onHit();
        });

        later(POWER_ATTACK, function () {
            ghost.remove();
            slot.style.visibility = '';
            if (SC.playSound) SC.playSound('slam');

            // squash into the spot and flash its glow
            slot.animate([
                { scale: '1.12 0.85' },
                { scale: '0.96 1.06', offset: 0.45 },
                { scale: '1' }
            ], { duration: ms(300), easing: 'ease-out' });

            const ring = getComputedStyle(slot).getPropertyValue('--ring').trim() || '#9a927e';
            cardEl.animate([
                { boxShadow: powerGlow(ring, 2) },
                { boxShadow: powerGlow(ring, 1) }
            ], { duration: ms(500), easing: 'ease-out' });
        });
    }

    // The Power card jumps and its glow flashes
    function pulsePower(slot) {
        if (SC.playSound) SC.playSound('powerUp');
        hold(ms(500));

        slot.animate([
            { scale: '1' },
            { scale: '1.15', offset: 0.3 },
            { scale: '1' }
        ], { duration: ms(450), easing: 'ease-out' });

        const card = slot.querySelector('.card');
        const ring = getComputedStyle(slot).getPropertyValue('--ring').trim() || '#9a927e';
        if (card) {
            card.animate([
                { boxShadow: powerGlow(ring, 1) },
                { boxShadow: powerGlow(ring, 2), offset: 0.3 },
                { boxShadow: powerGlow(ring, 1) }
            ], { duration: ms(500), easing: 'ease-out' });
        }

        const badge = slot.querySelector('.power-badge');
        if (badge) {
            badge.animate([
                { rotate: '0deg', scale: '1' },
                { rotate: '200deg', scale: '1.4', offset: 0.5 },
                { rotate: '360deg', scale: '1' }
            ], { duration: ms(500), easing: 'ease-out' });
        }
    }

    // ---------- Powers that block hits (Track Record, Padded Walls) ----------

    // The blocking Power cards out in front of their side right now
    let blockers = [];

    // Powers on this side that take damage off every hit
    function blockingPowers(side) {
        return (SC.combat.state[side].powers || []).filter(function (card) {
            return (card.effects || []).some(function (e) {
                return e.type === 'power' && e.trigger === 'Attacked' && e.effect &&
                    typeof e.effect.amount === 'number' && e.effect.amount < 0;
            });
        });
    }

    function powerSlotOf(side, card) {
        const i = (SC.combat.state[side].powers || []).indexOf(card);
        return i === -1 ? null : document.querySelectorAll('.battle__powers--' + side + ' > .power-slot')[i];
    }

    // An attack is on its way: this side's blocking Powers jump out of their
    // spots and stand between the attacker and the target. Returns where
    // the attack should hit (the front blocker), or null if there are none.
    function sendBlockers(side, attackerAt, targetAt) {
        const cards = blockingPowers(side);
        if (!cards.length || reducedMotion()) return null;

        let firstAt = null;
        cards.forEach(function (card, k) {
            const slot = powerSlotOf(side, card);
            const cardEl = slot && slot.querySelector('.card');
            if (!cardEl) return;

            // A little way out from the target, toward the attacker
            const at = {
                x: targetAt.x + (attackerAt.x - targetAt.x) * 0.3 + k * 18,
                y: targetAt.y + (attackerAt.y - targetAt.y) * 0.3 - k * 22
            };
            if (!firstAt) firstAt = at;

            const from = centerOf(slot);
            const ring = getComputedStyle(slot).getPropertyValue('--ring').trim() || '#a0a0a0';
            const ghost = makeGhost(cardEl.cloneNode(true), from, POWER_W);
            ghost.classList.add('fly-ghost--power');
            slot.style.visibility = 'hidden';

            if (SC.playSound && k === 0) SC.playSound('whoosh');
            const dx = at.x - from.x;
            const dy = at.y - from.y;
            ghost.animate([
                { transform: 'translate(0, 0) scale(1) rotate(0deg)' },
                { transform: 'translate(0, -40px) scale(1.15) rotate(-6deg)', offset: 0.3 },
                { transform: 'translate(' + dx + 'px, ' + dy + 'px) scale(1.1) rotate(3deg)' }
            ], { duration: ms(380), easing: 'cubic-bezier(.3, .7, .3, 1)', fill: 'forwards' });

            hold(ms(2000));
            blockers.push({ side: side, card: card, ghost: ghost, from: from, at: at, ring: ring });
        });
        return firstAt;
    }

    // An attack blocked by a Power bounces off it instead of just "hitting"
    function blockedOutcome(outcome, side) {
        const out = blockers.some(function (b) { return b.side === side; });
        return out && outcome === 'hit' ? 'bounce' : outcome;
    }

    // The attack landed: each hit a blocker soaked up makes it pulse in its
    // rarity color with a "-2 🛡", then they all go home after the last hit
    function blockHits(cardHits, side, doneAt) {
        const mine = blockers.filter(function (b) { return b.side === side; });
        if (!mine.length) return;

        // render() rebuilt the Power spots, so hide the new ones while they're out
        mine.forEach(function (b) {
            const slot = powerSlotOf(side, b.card);
            if (slot) slot.style.visibility = 'hidden';
        });

        const count = cardHits.length;
        const gap = count > 1 ? Math.min(300, BOB_MAX_TOTAL / (count - 1)) : 0;
        cardHits.forEach(function (h, i) {
            (h.blocks || []).forEach(function (blk) {
                const b = mine.find(function (x) { return x.card === blk.card; });
                if (b) later(i * gap, function () { pulseBlocker(b, blk.amount); });
            });
        });

        later(doneAt + 450, function () {
            mine.forEach(sendHome);
            blockers = blockers.filter(function (b) { return mine.indexOf(b) === -1; });
        });
    }

    function pulseBlocker(b, amount) {
        if (SC.playSound) SC.playSound('mitigate');
        hold(ms(600));

        const card = b.ghost.querySelector('.card');
        if (card) {
            card.animate([
                { boxShadow: '0 0 0 4px ' + b.ring + ', 0 0 20px 6px ' + b.ring },
                { boxShadow: '0 0 0 14px ' + b.ring + ', 0 0 80px 30px ' + b.ring, offset: 0.25 },
                { boxShadow: '0 0 0 4px ' + b.ring + ', 0 0 20px 6px ' + b.ring }
            ], { duration: ms(500), easing: 'ease-out' });
        }

        const face = b.ghost.querySelector('.fly-ghost__face');
        if (face) {
            face.animate([
                { scale: '1' },
                { scale: '1.12', offset: 0.25 },
                { scale: '1' }
            ], { duration: ms(400), easing: 'ease-out' });
        }

        floatAt(centerOf(b.ghost), '-' + amount + ' 🛡', 'fx-block', b.ring);
    }

    // Back to its spot, then slam down like when it was first played
    function sendHome(b) {
        const slot = powerSlotOf(b.side, b.card);
        const home = slot ? centerOf(slot) : b.from;
        const dx = home.x - b.from.x;
        const dy = home.y - b.from.y;
        const ax = b.at.x - b.from.x;
        const ay = b.at.y - b.from.y;
        hold(ms(800));

        b.ghost.animate([
            { transform: 'translate(' + ax + 'px, ' + ay + 'px) scale(1.1) rotate(3deg)' },
            { transform: 'translate(' + dx + 'px, ' + (dy - 50) + 'px) scale(1.2) rotate(-4deg)', offset: 0.75, easing: 'cubic-bezier(.7, 0, 1, .5)' },
            { transform: 'translate(' + dx + 'px, ' + dy + 'px) scale(1) rotate(0deg)' }
        ], { duration: ms(550), fill: 'forwards' })
            .finished.then(function () {
                b.ghost.remove();
                if (!slot) return;
                slot.style.visibility = '';
                if (SC.playSound) SC.playSound('slam');
                slot.animate([
                    { scale: '1.12 0.85' },
                    { scale: '0.96 1.06', offset: 0.45 },
                    { scale: '1' }
                ], { duration: ms(300), easing: 'ease-out' });
            });
    }

    // ---------- After an attack lands ----------

    // The attack card that just landed and is still on screen
    let flight = null;

    function moveTo(p) {
        return 'translate(' + p.x + 'px, ' + p.y + 'px) scale(' + p.scale + ') rotate(' + p.rot + 'deg)';
    }

    // What the attack card does after it hits, then it flies back to its
    // own side (your discard pile, or the enemy's side of the board) and fades.
    //   'bounce'  hit a defender that survived: bounces back off the shield
    //   'through' knocked the defender out: smashes on through it
    //   'hit'     no defender: just hits (no bounce)
    // Grab the attack card that just landed, so a later card can't take its place
    function takeFlight() {
        const f = flight;
        flight = null;
        return f;
    }

    function afterHit(outcome, f) {
        if (!f) return;

        const a = f.end;
        const length = Math.hypot(a.x, a.y) || 1;
        const dir = { x: a.x / length, y: a.y / length };     // the way it was flying

        let mid;
        if (outcome === 'bounce') {
            mid = { x: a.x - dir.x * 80, y: a.y - dir.y * 80 - 30, scale: a.scale, rot: a.rot - 30 };
        } else if (outcome === 'through') {
            mid = { x: a.x + dir.x * 120, y: a.y + dir.y * 120, scale: a.scale, rot: a.rot + 25 };
        } else {
            mid = { x: a.x - dir.x * 12, y: a.y - dir.y * 12, scale: a.scale, rot: a.rot };
        }

        const homeEl = document.querySelector(f.home);
        const homeAt = homeEl ? centerOf(homeEl) : f.from;
        const home = { x: homeAt.x - f.from.x, y: homeAt.y - f.from.y, scale: 0.55, rot: 0 };
        const gone = { x: home.x, y: home.y, scale: 0.4, rot: 0 };

        const duration = 950;
        hold(ms(duration));

        f.ghost.animate([
            { transform: moveTo(a), opacity: 1, easing: 'cubic-bezier(.2, .8, .3, 1)' },
            { transform: moveTo(mid), opacity: 1, offset: outcome === 'hit' ? 0.12 : 0.3, easing: 'ease-in-out' },
            { transform: moveTo(home), opacity: 1, offset: 0.8 },
            { transform: moveTo(gone), opacity: 0 }
        ], { duration: ms(duration), fill: 'forwards' })
            .finished.then(function () { f.ghost.remove(); });
    }

    // Which of those happened: look at the front defender before and after
    function hitOutcome(beforeUnits, nowField) {
        const front = (beforeUnits || [])[0];
        if (!front) return 'hit';
        return nowField.indexOf(front.unit) === -1 ? 'through' : 'bounce';
    }

    // Where an enemy card goes when it's played:
    //   Attack   -> your front defender (or your hero if none took the hit)
    //   Power    -> the enemy's Powers zone
    //   Defender -> the enemy's Defenders zone
    //   anything else (Relaxation, healing...) -> back into the enemy
    function aimFor(card, defenderSpot) {
        const hero = document.querySelector('.battle__hero');
        if (!card) {
            return defenderSpot || (hero ? centerOf(hero) : null);
        }

        const effects = card.effects || [];
        const has = function (type) {
            return effects.some(function (e) { return e.type === type; });
        };

        let sel = '.battle__enemy';
        if (has('damage')) {
            return defenderSpot || (hero ? centerOf(hero) : null);
        } else if (card.type === 'Power') {
            sel = '.battle__powers--enemy';
        } else if (has('defender')) {
            const units = document.querySelectorAll('.battle__field--enemy > .unit');
            if (units.length) return centerOf(units[units.length - 1]);
            sel = '.battle__field--enemy';
        }
        const el = document.querySelector(sel);
        return el ? centerOf(el) : null;
    }

    // aimAt: a point to fly to (a defender), or null to go at your hero
    // isAttack: the card stays fully visible and is kept for afterHit()
    function enemyAttack(old, aimAt, isAttack) {
        if (!old.node) return;
        const target = document.querySelector('.battle__hero');
        if (!target && !aimAt) return;

        const ghost = makeGhost(old.node, old.center, INTENT_W);
        const to = aimAt || centerOf(target);
        const end = { x: to.x - old.center.x, y: to.y - old.center.y, scale: 0.8, rot: 4 };

        const anim = ghost.animate([
            { transform: 'translate(0, 0) scale(1) rotate(0deg)', opacity: 1 },
            { transform: 'translate(0, -20px) scale(1.15) rotate(-6deg)', opacity: 1, offset: 0.25 },
            { transform: moveTo(end), opacity: isAttack ? 1 : 0 }
        ], {
            duration: ms(450),
            easing: 'cubic-bezier(.5, 0, .8, .4)',
            fill: 'forwards'
        });

        if (isAttack) {
            flight = { ghost: ghost, end: end, from: old.center, home: '.battle__intent' };
        } else {
            anim.finished.then(function () { ghost.remove(); });
        }
    }

    // New card: flips off the deck and lands in its slot
    function dealIn(slot) {
        const deck = document.querySelector('.pile--draw .pile__stack');
        const card = slot.querySelector('.card');
        if (!deck || !card) {
            slot.style.visibility = '';
            return;
        }

        const from = centerOf(deck);
        const to = centerOf(slot);
        const ghost = makeGhost(card.cloneNode(true), from, PILE_W);

        // Starts face down, flips face up on the way
        const back = ghost.querySelector('.fly-ghost__back');
        back.style.opacity = '1';
        back.animate([
            { opacity: 1 },
            { opacity: 1, offset: 0.35 },
            { opacity: 0, offset: 0.6 },
            { opacity: 0 }
        ], { duration: ms(420), fill: 'forwards' });

        flyGhost(ghost, from, to, HAND_W / PILE_W, 420, -60).then(function () {
            slot.style.visibility = '';
        });
    }

    // Shake + red flash + floating damage number
    // selector can be a CSS selector or the element itself
    function hit(selector, amount) {
        const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
        if (!el) return;

        el.style.animationDuration = ms(450) + 'ms';
        el.classList.remove('is-hit');
        void el.offsetWidth;            // restart the animation
        el.classList.add('is-hit');
        setTimeout(function () {
            el.classList.remove('is-hit');
            el.style.animationDuration = '';
        }, ms(500));

        const c = centerOf(el);
        const num = document.createElement('div');
        num.className = 'fx-damage';
        num.textContent = '-' + amount;
        num.style.left = c.x + 'px';
        num.style.top = c.y + 'px';
        document.body.appendChild(num);

        num.animate([
            { transform: 'translate(-50%, -50%) scale(0.5)', opacity: 0 },
            { transform: 'translate(-50%, -90%) scale(1.4)', opacity: 1, offset: 0.2 },
            { transform: 'translate(-50%, -250%) scale(1)', opacity: 0 }
        ], { duration: ms(950), easing: 'ease-out', fill: 'forwards' })
            .finished.then(function () { num.remove(); });
    }

    // Confiscated: stamped, then carried off the top of the screen
    function confiscate(old) {
        const ghost = makeGhost(old.node, old.center, HAND_W);

        const stamp = document.createElement('div');
        stamp.className = 'fx-stamp';
        stamp.textContent = 'CONFISCATED';
        ghost.appendChild(stamp);

        stamp.animate([
            { transform: 'translate(-50%, -50%) rotate(-12deg) scale(2.5)', opacity: 0 },
            { transform: 'translate(-50%, -50%) rotate(-12deg) scale(2.5)', opacity: 0, offset: 0.3 },
            { transform: 'translate(-50%, -50%) rotate(-12deg) scale(1)', opacity: 1, offset: 0.4 },
            { transform: 'translate(-50%, -50%) rotate(-12deg) scale(1)', opacity: 1 }
        ], { duration: ms(1300), fill: 'forwards' });

        ghost.animate([
            { transform: 'translate(0, 0) scale(1)', opacity: 1 },
            { transform: 'translate(0, -160px) scale(1.4)', opacity: 1, offset: 0.25 },
            { transform: 'translate(0, -160px) scale(1.4)', opacity: 1, offset: 0.65 },
            { transform: 'translate(0, -' + (old.center.y + 200) + 'px) scale(1.1) rotate(8deg)', opacity: 0 }
        ], {
            duration: ms(1300),
            easing: 'ease-in-out',
            fill: 'forwards'
        }).finished.then(function () { ghost.remove(); });
    }

    // Floating text like "+15 😌" that rises off something
    function floatText(selector, text, extraClass) {
        const el = document.querySelector(selector);
        if (!el) return;

        const c = centerOf(el);
        const num = document.createElement('div');
        num.className = 'fx-damage ' + extraClass;
        num.textContent = text;
        num.style.left = c.x + 'px';
        num.style.top = c.y + 'px';
        document.body.appendChild(num);

        num.animate([
            { transform: 'translate(-50%, -50%) scale(0.5)', opacity: 0 },
            { transform: 'translate(-50%, -90%) scale(1.3)', opacity: 1, offset: 0.2 },
            { transform: 'translate(-50%, -250%) scale(1)', opacity: 0 }
        ], { duration: ms(1100), easing: 'ease-out', fill: 'forwards' })
            .finished.then(function () { num.remove(); });
    }

    // ---------- Helpers ----------

    // Every time and delay goes through here, so SLOW controls them all
    function ms(n) {
        return Math.round(n * SLOW);
    }

    function later(n, fn) {
        hold(ms(n + 500));            // the screen is busy until this has played
        setTimeout(fn, ms(n));
    }

    // Remove anything still flying around (leaving the battle, or a new fight)
    function clear() {
        busyUntil = 0;
        flight = null;
        blockers = [];
        document.querySelectorAll('.fly-ghost, .fx-damage, .tear-half').forEach(function (el) {
            el.remove();
        });
    }

    // ---------- Busy: battle.js waits for animations before you can act ----------

    let busyUntil = 0;              // the moment the last animation ends

    // Keep the screen busy for at least this long (real ms) from now
    function hold(realMs) {
        busyUntil = Math.max(busyUntil, performance.now() + realMs);
    }

    // How much longer the animations still need (real ms), 0 when done
    function busyFor() {
        return Math.max(0, busyUntil - performance.now());
    }

    function remember(state) {
        lastHand = state.hand.slice();
        lastFields = { enemy: state.enemy.field.slice(), player: state.player.field.slice() };
        lastFieldHp = { enemy: state.enemy.field.map(hpOf), player: state.player.field.map(hpOf) };
        lastIntents = (state.enemy.next || []).slice();
        lastPowers = { enemy: (state.enemy.powers || []).slice(), player: (state.player.powers || []).slice() };
        lastEnemySanity = state.enemy.sanity;
        lastPlayerSanity = state.player.sanity;
        lastPlayerRelax = state.player.relaxation;
        lastEnemyRelax = state.enemy.relaxation;
    }

    function grab(card, slot) {
        const cardEl = slot && slot.querySelector('.card');
        return {
            card: card,
            center: slot ? centerOf(slot) : null,
            node: cardEl ? cardEl.cloneNode(true) : null
        };
    }

    function centerOf(el) {
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }

    // A floating copy of a card, centered on a point
    function makeGhost(cardNode, at, width) {
        width = width * (SC.battleScale || 1);   // match the battle's zoom

        const ghost = document.createElement('div');
        ghost.className = 'fly-ghost';
        ghost.style.width = width + 'px';
        ghost.style.height = (width * 9 / 16) + 'px';
        ghost.style.left = (at.x - width / 2) + 'px';
        ghost.style.top = (at.y - width * 9 / 32) + 'px';

        const face = document.createElement('div');
        face.className = 'fly-ghost__face';
        face.style.zoom = width / CARD_W;
        face.appendChild(cardNode);
        ghost.appendChild(face);

        const back = document.createElement('div');
        back.className = 'pile__card fly-ghost__back';
        ghost.appendChild(back);

        document.body.appendChild(ghost);
        return ghost;
    }

    // Move a ghost from one point to another in a little arc
    function flyGhost(ghost, from, to, endScale, duration, arc) {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const midScale = (1 + endScale) / 2 * 1.1;

        return ghost.animate([
            { transform: 'translate(0, 0) scale(1)' },
            { transform: 'translate(' + dx / 2 + 'px, ' + (dy / 2 + arc) + 'px) scale(' + midScale + ')' },
            { transform: 'translate(' + dx + 'px, ' + dy + 'px) scale(' + endScale + ')' }
        ], {
            duration: ms(duration),
            easing: 'cubic-bezier(.3, .7, .3, 1)',
            fill: 'forwards'
        }).finished.then(function () { ghost.remove(); });
    }

    // Fade the notecard back in so the card "lands face down"
    function flipToBack(ghost, duration, startAt) {
        ghost.querySelector('.fly-ghost__back').animate([
            { opacity: 0 },
            { opacity: 0, offset: startAt },
            { opacity: 1 }
        ], { duration: ms(duration), fill: 'forwards' });
    }

    // ---------- Defenders slamming down ----------

    // Any defender on the field now that wasn't there before is new
    function slamNewDefenders(beforeUnits, nowField, side, at) {
        const old = (beforeUnits || []).map(function (o) { return o.unit; });
        const els = Array.from(document.querySelectorAll('.battle__field--' + side + ' > .unit'));

        nowField.forEach(function (unit, i) {
            const el = els[i];
            if (!el || old.indexOf(unit) !== -1) return;

            // Hide it until its card lands, so it doesn't pop in early
            el.style.opacity = '0';
            later(at, function () { slamDown(el); });
        });
    }

    // The played card flies over its spot on the table, rises up, then slams down.
    // Returns the moment (before SLOW) it hits.
    function slamCardDown(old, spot) {
        const r = spot.getBoundingClientRect();
        const to = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        const dx = to.x - old.center.x;
        const dy = to.y - old.center.y;
        const endScale = r.width / (HAND_W * (SC.battleScale || 1));
        const duration = 700;

        const ghost = makeGhost(old.node, old.center, HAND_W);
        ghost.animate([
            // lift out of your hand
            { transform: 'translate(0, 0) scale(1) rotate(0deg)' },
            { transform: 'translate(0, -150px) scale(1.3) rotate(0deg)', offset: 0.25 },
            { transform: 'translate(0, -150px) scale(1.3) rotate(0deg)', offset: 0.4, easing: 'cubic-bezier(.3, 0, .2, 1)' },
            // hang in the air right above its spot
            { transform: 'translate(' + dx + 'px, ' + (dy - 80) + 'px) scale(' + (endScale * 1.3) + ') rotate(-5deg)', offset: 0.78, easing: 'cubic-bezier(.7, 0, 1, .5)' },
            // SLAM
            { transform: 'translate(' + dx + 'px, ' + dy + 'px) scale(' + endScale + ') rotate(0deg)' }
        ], { duration: ms(duration), fill: 'forwards' });

        // Keep the flying card until the real defender has taken its place
        later(duration + 40, function () { ghost.remove(); });

        return duration;
    }

    // Squash on the table, then light up blue
    function slamDown(el) {
        el.style.opacity = '';
        hold(ms(700));

        if (SC.playSound) SC.playSound('slam');

        // Squash flat from the hit, then spring back
        el.animate([
            { transform: 'scale(1.12, 0.82)' },
            { transform: 'scale(0.96, 1.06)', offset: 0.45 },
            { transform: 'scale(1)' }
        ], { duration: ms(300), easing: 'ease-out' });

        // Starts as a plain card, flashes white, then settles into its
        // rarity look (the end of the animation = whatever the CSS says)
        const look = getComputedStyle(el);
        el.animate([
            { borderColor: '#cbbf9f', backgroundColor: '#fbf7ea', boxShadow: NO_GLOW },
            { borderColor: '#ffffff', backgroundColor: '#ffffff', boxShadow: BIG_GLOW, offset: 0.3 },
            { borderColor: look.borderTopColor, backgroundColor: look.backgroundColor,
              boxShadow: 'rgba(255, 255, 255, 0) 0px 0px 0px 0px, ' + look.boxShadow }
        ], { duration: ms(700), easing: 'ease-out' });

        // The rarity glow (its own layer under the cards) fades in after the flash
        el.animate([
            { opacity: 0 },
            { opacity: 0, offset: 0.3 },
            { opacity: 1 }
        ], { duration: ms(700), easing: 'ease-out', pseudoElement: '::before' });

        later(100, function () {
            if (SC.playSound) SC.playSound('shieldUp');
        });

        // The shield pops in last
        const shield = el.querySelector('.unit__shield');
        if (shield) {
            shield.animate([
                { scale: '0', opacity: 0 },
                { scale: '0', opacity: 0, offset: 0.2 },
                { scale: '1.35', opacity: 1, offset: 0.6 },
                { scale: '1', opacity: 1 }
            ], { duration: ms(550), easing: 'ease-out' });
        }
    }

    // ---------- Power cards slamming down ----------

    // Any Power in play now that wasn't there before is new
    function slamNewPowers(beforePowers, nowPowers, side, at) {
        const els = Array.from(document.querySelectorAll('.battle__powers--' + side + ' > .power-slot'));

        (nowPowers || []).forEach(function (card, i) {
            const el = els[i];
            if (!el || (beforePowers || []).indexOf(card) !== -1) return;

            // Hide it until its card lands
            el.style.opacity = '0';
            later(at, function () { powerSlamDown(el); });
        });
    }

    // Squash on the table, raspberry glow lights up inside,
    // then the rarity ring bursts out and the ⚡ pops in
    function powerSlamDown(el) {
        el.style.opacity = '';
        hold(ms(700));

        if (SC.playSound) SC.playSound('slam');

        el.animate([
            { transform: 'scale(1.12, 0.82)' },
            { transform: 'scale(0.96, 1.06)', offset: 0.45 },
            { transform: 'scale(1)' }
        ], { duration: ms(300), easing: 'ease-out' });

        // This card's rarity color (set in CSS on .power-slot--rare etc.)
        const ring = getComputedStyle(el).getPropertyValue('--ring').trim() || '#9a927e';

        // Rarity edge appears and the raspberry glow bursts out, then settles
        const card = el.querySelector('.card');
        if (card) {
            card.animate([
                { boxShadow: powerGlow(ring, 0) },
                { boxShadow: powerGlow(ring, 2), offset: 0.3 },
                { boxShadow: powerGlow(ring, 1) }
            ], { duration: ms(700), easing: 'ease-out' });
        }

        later(100, function () {
            if (SC.playSound) SC.playSound('powerUp');
        });

        // Ring in the card's rarity color bursts outward
        later(120, function () {
            const burst = document.createElement('div');
            burst.className = 'power-burst';
            burst.style.borderColor = ring;
            burst.style.boxShadow = '0 0 40px 12px ' + ring;
            el.appendChild(burst);
            burst.animate([
                { transform: 'scale(1)', opacity: 0 },
                { transform: 'scale(1.03)', opacity: 1, offset: 0.25 },
                { transform: 'scale(1.35)', opacity: 0 }
            ], { duration: ms(650), easing: 'ease-out', fill: 'forwards' })
                .finished.then(function () { burst.remove(); });
        });

        // The ⚡ badge pops in last
        const badge = el.querySelector('.power-badge');
        if (badge) {
            badge.animate([
                { transform: 'scale(0) rotate(-90deg)', opacity: 0 },
                { transform: 'scale(0) rotate(-90deg)', opacity: 0, offset: 0.2 },
                { transform: 'scale(1.35) rotate(10deg)', opacity: 1, offset: 0.6 },
                { transform: 'scale(1) rotate(0deg)', opacity: 1 }
            ], { duration: ms(550), easing: 'ease-out' });
        }
    }

    // A Power's outline: rarity edge, raspberry glow, drop shadow (matches .power-slot .card in CSS)
    // level 0 = nothing yet, 2 = big burst, 1 = normal
    function powerGlow(ring, level) {
        if (level === 0) {
            return '0 0 0 6px transparent, 0 0 0 0 rgba(200, 60, 120, 0), 0 8px 16px rgba(0, 0, 0, 0.45)';
        }
        if (level === 2) {
            return '0 0 0 6px ' + ring + ', 0 0 90px 30px rgba(225, 85, 145, 0.95), 0 8px 16px rgba(0, 0, 0, 0.45)';
        }
        return '0 0 0 6px ' + ring + ', 0 0 50px 18px rgba(200, 60, 120, 0.95), 0 8px 16px rgba(0, 0, 0, 0.45)';
    }

    // Defender slam flash: 2 shadows each (a white flash, then the drop shadow)
    const NO_GLOW  = '0 0 0 0 rgba(255, 255, 255, 0), 0 6px 12px rgba(0, 0, 0, 0.45)';
    const BIG_GLOW = '0 0 50px 22px rgba(255, 255, 255, 0.95), 0 6px 12px rgba(0, 0, 0, 0.45)';

    // ---------- Tearing cards in half ----------

    // The jagged rip down the middle of the card
    const LEFT_HALF  = 'polygon(0 0, 54% 0, 48% 14%, 55% 28%, 46% 44%, 53% 60%, 45% 76%, 52% 90%, 49% 100%, 0 100%)';
    const RIGHT_HALF = 'polygon(54% 0, 100% 0, 100% 100%, 49% 100%, 52% 90%, 45% 76%, 53% 60%, 46% 44%, 55% 28%, 48% 14%)';

    function hpOf(unit) {
        return unit.sanity;
    }

    // Copies of the defenders on a field, taken before render() rebuilds it
    function grabUnits(side) {
        const els = Array.from(document.querySelectorAll('.battle__field--' + side + ' > .unit'));
        return lastFields[side].map(function (unit, i) {
            const el = els[i];
            if (!el) return null;
            return {
                unit: unit,
                sanity: lastFieldHp[side][i],   // Sanity before this turn's hits
                center: centerOf(el),
                node: el.cloneNode(true),
                left: el.offsetLeft,
                top: el.offsetTop,
                width: el.offsetWidth,
                transform: getComputedStyle(el).transform
            };
        }).filter(Boolean);
    }

    // Any defender that was on the field before but isn't now got knocked out
    function tearKnockedOut(beforeUnits, nowField, side, at) {
        const gone = (beforeUnits || []).filter(function (old) {
            return nowField.indexOf(old.unit) === -1;
        });
        if (!gone.length) return;

        // render() already removed it, so put a stand-in copy where it was
        // until the hit lands (otherwise it vanishes before it's attacked)
        const field = document.querySelector('.battle__field--' + side);
        if (!field) return;
        const standIns = gone.map(function (old) {
            const copy = old.node.cloneNode(true);
            copy.classList.add('tear-half');
            copy.style.left = old.left + 'px';
            copy.style.top = old.top + 'px';
            copy.style.width = old.width + 'px';
            field.appendChild(copy);
            old.standIn = copy;           // multi-hit cards still hit this copy
            return copy;
        });

        later(at, function () {
            gone.forEach(function (old) {
                // Rip the stand-in as it looks now (its shield may have counted down)
                const node = old.standIn ? old.standIn.cloneNode(true) : old.node;
                node.classList.remove('is-hit');
                tearCopy(node, field, old.left, old.top, old.width, old.transform);
            });
            standIns.forEach(function (copy) { copy.remove(); });
        });
    }

    // How much each defender on a side just lost (front one first)
    function defenderDamage(beforeUnits, nowField, side) {
        const els = Array.from(document.querySelectorAll('.battle__field--' + side + ' > .unit'));
        return (beforeUnits || []).map(function (old) {
            const i = nowField.indexOf(old.unit);
            const now = i === -1 ? 0 : old.unit.sanity;
            return { el: i === -1 ? null : els[i], center: old.center, loss: old.sanity - now };
        }).filter(function (g) {
            return g.loss > 0;
        });
    }

    // A defender takes the hit: it shakes and shows the damage.
    // Knocked-out ones just show the number (then they rip in half).
    function hitDefender(g) {
        if (SC.playSound) SC.playSound('shieldHit');

        if (g.el) {
            hit(g.el, g.loss);
            return;
        }
        const num = document.createElement('div');
        num.className = 'fx-damage';
        num.textContent = '-' + g.loss;
        num.style.left = g.center.x + 'px';
        num.style.top = g.center.y + 'px';
        document.body.appendChild(num);
        num.animate([
            { transform: 'translate(-50%, -50%) scale(0.5)', opacity: 0 },
            { transform: 'translate(-50%, -90%) scale(1.4)', opacity: 1, offset: 0.2 },
            { transform: 'translate(-50%, -250%) scale(1)', opacity: 0 }
        ], { duration: ms(950), easing: 'ease-out', fill: 'forwards' })
            .finished.then(function () { num.remove(); });
    }

    // Rip a card that's still on screen (the enemy or your hero badge)
    function tearApart(el) {
        tearCopy(el.cloneNode(true), el.offsetParent, el.offsetLeft, el.offsetTop,
            el.offsetWidth, getComputedStyle(el).transform);
        el.style.visibility = 'hidden';
    }

    // Two copies of the card, each showing one jagged half, falling apart
    function tearCopy(node, parent, left, top, width, baseTransform) {
        if (!parent) return;
        hold(ms(900));
        const base = baseTransform && baseTransform !== 'none' ? baseTransform + ' ' : '';

        if (SC.playSound) {
            SC.playSound('ripApart');
        }

        ['left', 'right'].forEach(function (side) {
            const dir = side === 'left' ? -1 : 1;
            const half = node.cloneNode(true);
            half.classList.add('tear-half');
            half.style.left = left + 'px';
            half.style.top = top + 'px';
            half.style.width = width + 'px';
            half.style.clipPath = side === 'left' ? LEFT_HALF : RIGHT_HALF;
            parent.appendChild(half);

            half.animate([
                { transform: base + 'translate(0, 0) rotate(0deg)', opacity: 1 },
                { transform: base + 'translate(' + (dir * 8) + 'px, -4px) rotate(' + (dir * 3) + 'deg)', opacity: 1, offset: 0.2 },
                { transform: base + 'translate(' + (dir * 70) + 'px, 140px) rotate(' + (dir * 20) + 'deg)', opacity: 0 }
            ], {
                duration: ms(900),
                easing: 'cubic-bezier(.4, 0, .8, .6)',
                fill: 'forwards'
            }).finished.then(function () { half.remove(); });
        });
    }

    function reducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    SC.battleFx = {
        reset: reset,
        mark: mark,
        snapshot: snapshot,
        play: play,
        enemyCardFly: enemyCardFly,
        attackFly: attackFly,
        busyFor: busyFor,
        clear: clear,
        ms: ms
    };
})();