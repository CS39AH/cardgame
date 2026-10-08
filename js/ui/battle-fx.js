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
    const HAND_W = 200;     // hand cards are zoom 0.5
    const INTENT_W = 180;   // intent cards are zoom 0.45
    const PILE_W = 144;     // 9rem pile cards

    // What the screen looked like after the last render
    let lastHand = [];
    let lastEnemySanity = 0;
    let lastPlayerSanity = 0;
    let lastPlayerRelax = 0;
    let nextKind = 'play';

    // ---------- Called from battle.js ----------

    // New fight: forget the old screen
    function reset(state) {
        lastHand = [];
        lastEnemySanity = state.enemy.sanity;
        lastPlayerSanity = state.player.sanity;
        lastPlayerRelax = state.player.relaxation;
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
            intents: intents.map(function (slot) {
                return grab(null, slot);
            }),
            enemySanity: lastEnemySanity,
            playerSanity: lastPlayerSanity,
            playerRelax: lastPlayerRelax
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

        if (reducedMotion()) {
            return;
        }

        // Hide drawn cards right away so they don't flash in early
        drawn.forEach(function (slot) {
            slot.style.visibility = 'hidden';
        });

        let t = 0;

        if (kind === 'endTurn') {
            // 1. Leftover hand sweeps into the discard pile
            leftHand.forEach(function (old, k) {
                later(k * 70, function () { toDiscard(old); });
            });
            t = leftHand.length ? 420 + leftHand.length * 70 : 0;

            if (enemyLoss > 0) {
                later(0, function () { hit('.battle__enemy', enemyLoss); });
            }

            // 2. Enemy's card flies at your hero
            if (before.intents.length) {
                later(t, function () {
                    before.intents.forEach(function (old) { enemyAttack(old); });
                });
                t += 450;
            }
            if (playerLoss > 0) {
                later(t, function () { hit('.battle__hero', playerLoss); });
                t += 350;
            }
        } else {
            // A card was played
            leftHand.forEach(function (old) {
                const impact = playedCard(old, enemyLoss);
                if (enemyLoss > 0) {
                    later(impact, function () { hit('.battle__enemy', enemyLoss); });
                }
            });
            t = leftHand.length ? 650 : 0;

            if (playerLoss > 0) {
                later(t, function () { hit('.battle__hero', playerLoss); });
            }

            // Healing and Relaxation from your own cards
            const relaxGain = state.player.relaxation - before.playerRelax;
            if (playerLoss < 0) {
                later(500, function () {
                    floatText('.battle__hero', '+' + (-playerLoss) + ' 🧠', 'fx-heal');
                });
            }
            if (relaxGain > 0) {
                later(700, function () {
                    floatText('.battle__hero', '+' + relaxGain + ' 😌', 'fx-relax');
                });
            }
        }

        // 3. Deal new cards from the deck
        drawn.forEach(function (slot, k) {
            later(t + k * 110, function () { dealIn(slot); });
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
            targetSel = '.battle__field--player';
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
    function enemyAttack(old) {
        if (!old.node) return;
        const target = document.querySelector('.battle__hero');
        if (!target) return;

        const ghost = makeGhost(old.node, old.center, INTENT_W);
        const to = centerOf(target);
        const dx = to.x - old.center.x;
        const dy = to.y - old.center.y;

        ghost.animate([
            { transform: 'translate(0, 0) scale(1) rotate(0deg)', opacity: 1 },
            { transform: 'translate(0, -20px) scale(1.15) rotate(-6deg)', opacity: 1, offset: 0.25 },
            { transform: 'translate(' + dx + 'px, ' + dy + 'px) scale(0.8) rotate(4deg)', opacity: 0 }
        ], {
            duration: ms(450),
            easing: 'cubic-bezier(.5, 0, .8, .4)',
            fill: 'forwards'
        }).finished.then(function () { ghost.remove(); });
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
    function hit(selector, amount) {
        const el = document.querySelector(selector);
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
        setTimeout(fn, ms(n));
    }

    function remember(state) {
        lastHand = state.hand.slice();
        lastEnemySanity = state.enemy.sanity;
        lastPlayerSanity = state.player.sanity;
        lastPlayerRelax = state.player.relaxation;
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

    function reducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    SC.battleFx = {
        reset: reset,
        mark: mark,
        snapshot: snapshot,
        play: play
    };
})();