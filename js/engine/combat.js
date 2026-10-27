/* =========================================================
   SUBSTITUTE CHAOS — COMBAT ENGINE
   =========================================================
   All the fight rules. No drawing here; js/ui/battle.js
   reads SC.combat.state and draws it.

   SC.combat.start(levelId, heroId)  start a fight
   SC.combat.playCard(handIndex)     play a card, true if it worked
   SC.combat.endTurn()               discard hand, enemy plays, next turn

   The battle screen does End Turn one step at a time instead,
   so you can watch the enemy play its cards one by one:
   SC.combat.startEnemyTurn()        discard your hand
   SC.combat.enemyPlayNext()         enemy plays ONE card (null when done)
   SC.combat.finishEnemyTurn()       your next turn starts

   Damage rule: defenders on the field take hits first, then
   Relaxation, then Sanity. Relaxation lasts until your next turn.

   Power cards stay in play (side.powers) and react to triggers:
     'playAttack'  owner played an Attack     (Teacher's Pet)
     'directSanityAttack'  Attack card reached enemy Sanity (Golden Spork)
     'Attacked'    owner is hit by an attack  (Track Record, amount is negative)
     'Attacks'     owner's attacks get +amount (Pencil Sharpener)
   ========================================================= */

window.SC = window.SC || {};

(function () {
    'use strict';

    const combat = { state: null };

    // ------- START A FIGHT -------

    combat.start = function (levelId, heroId, deckIds) {
        const level = SC.levels[levelId] || SC.levels.tutorial;
        const enemyDef = SC.enemies[level.enemy];
        const hero = SC.getCard(heroId);

        // Enemy deck: turn the ID list into card copies, shuffle if the enemy asks for it
        const enemyDeck = (enemyDef.startingDeck || [])
            .map(function (c) { return typeof c === 'string' ? copyCard(c) : c; })
            .filter(Boolean);

        if (enemyDef.shuffleEnemyDeck) {
            shuffle(enemyDeck);
        }

        const state = {
            level: level,
            turn: 1,
            result: null,              // 'win' or 'lose' when it's over
            teacherAbilityUsed: false,
            teacherId: heroId,   

            player: {
                heroId: heroId,
                sanity: hero?.startingSanity ?? level.sanity,
                maxSanity: hero?.startingSanity ?? level.sanity,
                relaxation: 0,
                energy: hero?.startingEnergy ?? level.energy,
                maxEnergy: hero?.startingEnergy ?? level.energy,
                field: [],             // defenders
                powers: [],            // Power cards in play
                status: {}
            },

            enemy: {
                id: enemyDef.id,
                name: enemyDef.name,
                art: enemyDef.art,
                image: enemyDef.image || null,
                imageScale: enemyDef.imageScale || 1,   // zoom the picture (enemies.js)
                sanity: enemyDef.sanity,
                maxSanity: enemyDef.sanity,
                relaxation: 0,
                field: [],
                powers: [],
                status: {},
                deck: enemyDeck,
                order: enemyDef.order || 'inOrder',
                energy: enemyDef.energy || 3,      // its own Coffee each turn
                maxEnergy: enemyDef.energy || 3,
                deckIndex: 0,
                next: []               // what it plays next turn (shown on screen)
            },

            drawPile: buildStartingDeck(level, hero ,deckIds),
            hand: [],
            discard: [],
            confiscated: [],
            log: [],
            powerFires: [],        // Powers that just went off (the battle screen animates these)
            hitLog: []             // every single hit of the last card (for multi-hit animations)
        };

        combat.state = state;

        addLog(level.intro || 'The fight begins!');
        drawCards(level.handSize);
        pickEnemyCards();

        return state;
    };
    
    function buildEnemyStartingDeck(enemyDef) {
        if (enemyDef.startingDeck && enemyDef.startingDeck.length) {
            const deck = enemyDef.startingDeck.map(copyCard).filter(Boolean);
            return enemyDef.shuffleEnemyDeck === false ? deck : shuffle(deck);
        }
        // Empty default — enemy will fill its own cards as needed
        return [];
    }
    // Tutorial: exact list in order. Real levels: random deck.
    function buildStartingDeck(level, hero, deckIds) {
        // Order of priority: the level's own list, then the teacher's deck
        const list = level.startingDeck || deckIds || (hero && hero.startingDeck);
        const bonusCards = (level.bonusCards || []).map(copyCard).filter(Boolean);

        if (list) {
            const deck = list.map(copyCard).filter(Boolean).concat(bonusCards);
            return level.shuffleDeck === false ? deck : shuffle(deck);
        }

        // Last resort: random deck from the card pool (code unchanged)
        const pool = SC.cards.filter(function (card) {
            return !card.demo && !card.hero && card.rarity !== 'Enemy' && !card.rewardOnly;
        });

        const deck = (level.guaranteedCards || []).map(copyCard).filter(Boolean);
        while (deck.length < (level.deckSize || 10) && pool.length) {
            const pick = pool[Math.floor(Math.random() * pool.length)];
            deck.push(copyCard(pick.id));
        }
        return shuffle(deck.concat(bonusCards));
    }

    // Every card in a fight is its own copy, so two Red Pens are two objects
    function copyCard(id) {
        const card = SC.getCard(id);
        if (!card) {
            console.warn('Unknown card id:', id);
            return null;
        }
        return Object.assign({}, card);
    }

    // ------- PLAYER ACTIONS -------

    combat.playCard = function (handIndex) {
        const s = combat.state;
        if (!s || s.result) return false;

        const card = s.hand[handIndex];
        if (!card) return false;
        s.powerFires = [];
        s.hitLog = [];

        if (card.cost > s.player.energy) {
            addLog('Not enough Coffee for ' + card.name + '.');
            return false;
        }

        s.player.energy -= card.cost;
        s.player.cardsPlayed = (s.player.cardsPlayed || 0) + 1;   // Bin Dump counts these
        s.hand.splice(handIndex, 1);
        addLog('You played ' + card.name + '.');

        // Track Sanity damage from this card, separate from any triggered Powers.
        const effectContext = resolveCard(card, 'player');

        // Where the card goes after it's played
        if (card.type === 'Power') {
            s.player.powers.push(card);
        } else if (hasEffect(card, 'confiscate')) {
            s.confiscated.push(card);
            addLog(card.name + ' was confiscated.');
        } else {
            s.discard.push(card);
        }

        // Powers that react to you playing an Attack
        if (isAttack(card) && card.type !== 'Power') {
            // Golden Spork heals once per Attack card if it reached enemy Sanity.
            if (card.type === 'Attack' && effectContext.sanityDamageDealt > 0) {
                firePowers('player', 'directSanityAttack');
            }
            firePowers('player', 'playAttack');
        }
        
        // Powers that react to you playing a Defense card
        if (card.type === 'Defense') {
            firePowers('player', 'playDefense');
        }

        checkResult();
        return true;
    };

    combat.useTeacherAbility = function () {    // Teacher Ability Function.
        const s = combat.state;

        if (!s || s.result || s.teacherAbilityUsed) {
            return false;
        }

        const teacher = SC.getCard(s.player.heroId);

        if (!teacher) {
            return false;
        }

        // Teacher abilities cost Coffee.
        if (s.player.energy < teacher.cost) {
            addLog('Not enough Coffee to use ' + teacher.name + "'s ability.");
            return false;
        }

        s.player.energy -= teacher.cost;

        addLog('You used ' + teacher.name + "'s ability.");

        if (teacher.type === 'Power') {
            s.player.powers.push(teacher);
        } else {
            resolveCard(teacher, 'player');
        }

        s.teacherAbilityUsed = true;

        checkResult();
        return true;
    };

    // All of End Turn at once
    combat.endTurn = function () {
        combat.startEnemyTurn();
        while (combat.enemyPlayNext()) {
            // keep going until the enemy is out of cards
        }
        combat.finishEnemyTurn();
    };

    // Step 1: leftover hand goes to the discard pile
    combat.startEnemyTurn = function () {
        const s = combat.state;
        if (!s || s.result) return;

        while (s.hand.length) {
            s.discard.push(s.hand.shift());
        }
        s.enemy.relaxation = 0;                // its Relaxation lasts one turn
    };

    // Step 2: the enemy plays its next card.
    // Returns the card, or null when it has nothing left to play.
    combat.enemyPlayNext = function () {
        const s = combat.state;
        if (!s || s.result) return null;

        const enemy = s.enemy;
        const card = enemy.next.shift();
        s.powerFires = [];
        s.hitLog = [];
        if (!card) return null;

        addLog(enemy.name + ' played ' + card.name + '.');
        resolveCard(card, 'enemy');

        if (card.type === 'Power') {
            enemy.powers.push(card);
        }
        if (isAttack(card) && card.type !== 'Power') {
            firePowers('enemy', 'playAttack');
        }
        checkResult();
        return card;
    };

    // Step 3: your next turn starts
    combat.finishEnemyTurn = function () {
        const s = combat.state;
        if (!s) return;

        s.enemy.next = [];
        checkResult();
        if (s.result) return;

        // Your next turn
        s.turn += 1;
        s.player.cardsPlayed = 0;              // start counting again
        s.player.relaxation = 0;               // Relaxation lasts one turn
        if (s.level.refillEnergy) {
            s.player.energy = s.player.maxEnergy;
        }
        
        // Apply Spoiled Milk's Coffee penalty.
        const energyPenalty = s.player.status.nextTurnEnergyPenalty || 0;

        s.player.energy = Math.max(0, s.player.energy - energyPenalty);
        s.player.status.nextTurnEnergyPenalty = 0;

        drawCards(s.level.handSize);
        pickEnemyCards();
    };

    // ------- ENEMY -------

    // Choose what the enemy plays next turn (shown as its intent).
    // The enemy has its own Coffee (maxEnergy, 3 by default). It keeps
    // adding cards until the next one costs more than it has left.
    function pickEnemyCards() {
        const enemy = combat.state.enemy;
        let coffee = enemy.maxEnergy;

        enemy.next = [];

        // A Power already in play (or already picked this turn) isn't played again
        function canPlay(card) {
            if (card.type !== 'Power') return true;
            return !enemy.powers.concat(enemy.next).some(function (p) {
                return p.id === card.id;
            });
        }

        // "tries" is just a safety limit so a bad deck can never loop forever
        for (let tries = 0; tries < 20; tries++) {
            const playable = enemy.deck.filter(canPlay);
            if (!playable.length) break;

            let card;

            if (enemy.order === 'random') {
                const affordable = playable.filter(function (c) {
                    return c.cost <= coffee;
                });
                if (!affordable.length) break;
                card = affordable[Math.floor(Math.random() * affordable.length)];
            } else {
                card = enemy.deck[enemy.deckIndex % enemy.deck.length];

                // Skip a Power that's already out, or a card it could never
                // afford, so the enemy never gets stuck on it
                if (!canPlay(card) || card.cost > enemy.maxEnergy) {
                    enemy.deckIndex += 1;
                    continue;
                }

                // Can't afford the next card: stop and save it for next turn
                if (card.cost > coffee) break;

                enemy.deckIndex += 1;
            }

            enemy.next.push(card);
            coffee -= card.cost;
        }

        // Coffee left over after next turn's plan (shown on screen)
        enemy.energy = coffee;
    }

    // ------- CARD EFFECTS -------

    // Runs every effect on a card for whoever played it
    function resolveCard(card, who) {
        const ctx = { lastDamage: 0, sanityDamageDealt: 0 };
        (card.effects || []).forEach(function (effect) {
            resolveEffect(effect, who, card, ctx);
        });
        return ctx;
    }

    function resolveEffect(effect, who, card, ctx) {
        const s = combat.state;
        const owner = sideOf(who);
        const foeWho = who === 'player' ? 'enemy' : 'player';
        const amount = amountOf(effect.amount);

        switch (effect.type) {
            
            case 'damage': {
                const total = Math.max(0, amount + attackBonus(who));

                // "times" = hit that many times, e.g. once per card you played.
                // Leave it out for a normal single hit.
                const times = effect.times !== undefined ? amountOf(effect.times) : 1;
                let dealt = 0;
                for (let i = 0; i < times && !s.result; i++) {
                    dealt += hit(foeWho, total);
                }
                ctx.lastSanityDamage = dealt;
                ctx.sanityDamageDealt = (ctx.sanityDamageDealt || 0) + dealt;
                ctx.lastDamage = total;
                break;
            }

            case 'multiplier':
                // "Deal 2 damage 3 times" = damage once, then repeat 2 more times
                for (let i = 1; i < amount && !s.result; i++) {
                    ctx.sanityDamageDealt = (ctx.sanityDamageDealt || 0) + hit(foeWho, ctx.lastDamage);
                }
                break;

            case 'lifesteal': {
                const damageDealt = ctx.lastSanityDamage || 0;
                const healing = Math.floor(damageDealt * effect.fraction);

                owner.sanity = Math.min(
                    owner.maxSanity,
                    owner.sanity + healing
                );
                break;
            }

            case 'block':
                owner.relaxation += amount;
                break;

            case 'defender':
                owner.field.push({
                    name: effect.name || card.name,
                    art: effect.art || card.art,
                    rarity: card.rarity || 'Common',             // for its rarity color on the table
                    image: effect.image || card.image || null,   // the card's picture, if it has one
                    imageScale: card.imageScale || 1,
                    sanity: amount,
                    maxSanity: amount,
                    attackBonus: effect.attackBonus || 0
                });
                addLog((who === 'player' ? 'You put' : s.enemy.name + ' put') +
                    ' a ' + (effect.name || card.name) + ' on the field.');
                break;

            case 'energy':
                if (who === 'player') {
                    s.player.energy += amount;
                }
                break;
       
            case 'reduceNextTurnEnergy':
                if (who === 'enemy') {
                    s.player.status.nextTurnEnergyPenalty =
                        (s.player.status.nextTurnEnergyPenalty || 0) + amount;
                }
                break;


            case 'draw':
                if (who === 'player') {
                    drawCards(amount);
                }
                break;

            case 'heal':
                owner.sanity = Math.min(owner.maxSanity, owner.sanity + amount);
                break;

            case 'shuffle':
                if (who === 'player') {
                    while (s.discard.length) {
                        s.drawPile.push(s.discard.pop());
                    }
                    shuffle(s.drawPile);
                    addLog('Shuffled your discard pile into your deck.');
                }
                break;

            case 'status': {
                // Tracked so the team can build it; no effect yet
                const target = sideOf(foeWho);
                target.status[effect.status] = (target.status[effect.status] || 0) + amount;
                break;
            }

            case 'confiscate':   // handled in playCard
            case 'power':        // passive; handled by firePowers
                break;

            default:
                addLog('"' + effect.type + '" effects are not built yet.');
        }
    }

    // Numbers on cards can also be words like 'player discard pile size'
    function amountOf(amount) {
        if (typeof amount === 'number') return amount;
        if (amount === 'player discard pile size') return combat.state.discard.length;
        if (amount === 'cards played by player') return combat.state.player.cardsPlayed || 0;
        return 0;
    }

    // ------- DAMAGE -------

    // Defenders first, then Relaxation, then Sanity
    function hit(targetWho, amount) {
        const target = sideOf(targetWho);
        const fieldBefore = fieldSanity(target);
        const startSanity = target.sanity;
        const startRelax = target.relaxation;

        // Powers like Track Record soften every hit (remember which ones did,
        // so the battle screen can show them blocking)
        const blocks = blockedBy(targetWho, amount);
        amount = Math.max(0, amount + powerTotal(targetWho, 'Attacked'));

        // 1. Defenders, front one first
        while (amount > 0 && target.field.length) {
            const defender = target.field[0];
            const taken = Math.min(defender.sanity, amount);
            defender.sanity -= taken;
            amount -= taken;

            if (defender.sanity <= 0) {
                target.field.shift();
                addLog(defender.name + ' was knocked out.');
            }
        }

        // 2. Relaxation
        const blocked = Math.min(target.relaxation, amount);
        target.relaxation -= blocked;
        amount -= blocked;

        
        // 3. Sanity
        const sanityBefore = target.sanity;
        target.sanity = Math.max(0, target.sanity - amount);

        // Remember this one hit, so the battle screen can show each hit
        // of a "Deal 2 damage 3 times" card separately
        combat.state.hitLog.push({
            who: targetWho,
            defender: fieldBefore - fieldSanity(target),   // damage to defenders
            sanity: startSanity - target.sanity,          // damage to the enemy/hero
            relax: startRelax - target.relaxation,        // soaked up by Relaxation
            blocks: blocks,                               // Powers that took some of it
            fromPower: firingPower                        // a Power did it, not the card
        });

        // Return the actual Sanity damage dealt.
        return sanityBefore - target.sanity;
    }

    // Which 'Attacked' Powers (Track Record, Padded Walls...) take part
    // of this hit, and how much each one stops: [{ card, amount }]
    function blockedBy(who, incoming) {
        const list = [];
        let left = incoming;
        sideOf(who).powers.forEach(function (card) {
            (card.effects || []).forEach(function (effect) {
                if (effect.type !== 'power' || effect.trigger !== 'Attacked' || !effect.effect) return;
                const stops = -amountOf(effect.effect.amount);
                if (stops <= 0 || left <= 0) return;
                const amount = Math.min(stops, left);
                left -= amount;
                list.push({ card: card, amount: amount });
            });
        });
        return list;
    }

    // ------- POWERS -------

    // True while a Power's effect is running (so its hits are tagged)
    let firingPower = false;

    // Run the inner effect of every Power with this trigger
    function firePowers(who, trigger) {
        const side = sideOf(who);
        side.powers.forEach(function (card) {
            (card.effects || []).forEach(function (effect) {
                if (effect.type === 'power' && effect.trigger === trigger && effect.effect) {
                    const foe = sideOf(who === 'player' ? 'enemy' : 'player');
                    const sanityBefore = foe.sanity;
                    const fieldBefore = fieldSanity(foe);
                    const relaxBefore = foe.relaxation;

                    firingPower = true;
                    resolveEffect(effect.effect, who, card, { lastDamage: 0 });
                    firingPower = false;

                    // Remember it, so the battle screen can show this Power going off
                    combat.state.powerFires.push({
                        who: who,
                        card: card,
                        sanityLoss: sanityBefore - foe.sanity,          // damage to the enemy/hero
                        defenderLoss: fieldBefore - fieldSanity(foe),   // damage to defenders
                        relaxLoss: relaxBefore - foe.relaxation,        // soaked up by Relaxation
                        attacks: effect.effect.type === 'damage' &&      // an attacking Power (even if
                            amountOf(effect.effect.amount) > 0          // it ends up doing 0 damage)
                    });
                }
            });
        });
    }

    // All the Sanity left on a side's defenders, added up
    function fieldSanity(side) {
        return side.field.reduce(function (total, unit) {
            return total + Math.max(0, unit.sanity);
        }, 0);
    }

    // Add up the numbers on Powers with this trigger (no effect run)
    function powerTotal(who, trigger) {
        let total = 0;
        sideOf(who).powers.forEach(function (card) {
            (card.effects || []).forEach(function (effect) {
                if (effect.type === 'power' && effect.trigger === trigger && effect.effect) {
                    total += amountOf(effect.effect.amount);
                }
            });
        });
        return total;
    }

    // Extra damage from Powers like Pencil Sharpener  
    function attackBonus(who) {
        const powerBonus = powerTotal(who, 'Attacks');

        // Check if the player has an active Clean Tray defender.
        const hasCleanTray = who === 'player' &&
            sideOf(who).field.some(function (defender) {
                return defender.name === 'Clean Tray' &&
                    defender.sanity > 0 &&
                    defender.attackBonus > 0;
            });

        // Multiple Clean Trays do not stack their bonuses.
        return powerBonus + (hasCleanTray ? 1 : 0);
    }


    // ------- DECK -------

    function drawCards(count) {
        const s = combat.state;
        for (let i = 0; i < count; i++) {
            if (!s.drawPile.length) {
                if (!s.discard.length) return;     // nothing left anywhere
                while (s.discard.length) {
                    s.drawPile.push(s.discard.pop());
                }
                shuffle(s.drawPile);
                addLog('Reshuffled the discard pile.');
            }
            s.hand.push(s.drawPile.shift());
        }
    }

    function shuffle(list) {
        for (let i = list.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = list[i];
            list[i] = list[j];
            list[j] = temp;
        }
        return list;
    }

    // ------- HELPERS -------

    function checkResult() {
        const s = combat.state;
        if (s.result) return;

        if (s.enemy.sanity <= 0) {
            s.result = 'win';
            addLog(s.enemy.name + ' gave up!');
        } else if (s.player.sanity <= 0) {
            s.result = 'lose';
            addLog('You ran out of Sanity.');
        }
    }

    function sideOf(who) {
        return who === 'player' ? combat.state.player : combat.state.enemy;
    }

    function hasEffect(card, type) {
        return (card.effects || []).some(function (e) { return e.type === type; });
    }

    function isAttack(card) {
        return card.type === 'Attack' || hasEffect(card, 'damage');
    }

    function addLog(text) {
        combat.state.log.push(text);
    }
// Boss reward tables: boss id -> the specific cards offered after defeating them
combat.bossRewards = {
    'class-clown':   ['dismissal-bell', 'yard-stick', 'golden-apple'],
    'cafeteria-enemy':    ['golden-spork', 'bottomless-chocolate-milk', 'lunch-ladys-legendary-special'],
    'gym-enemy':   ['team-spirit', 'basketball-pass', 'stacked-mats']
};

// Boss rewards: fixed cards for a given boss
combat.bossRewardChoices = function (bossId) {
    const ids = combat.bossRewards[bossId];
    if (!ids) return null;

    const cards = ids.map(function (id) {
        return SC.cards.find(function (card) { return card.id === id; });
    }).filter(Boolean); // drops any ID that doesn't match a card

    if (cards.length !== ids.length) {
        console.warn('bossRewards for "' + bossId + '" references missing card IDs');
    }

    return cards.map(function (card) {
        return Object.assign({}, card);
    });
};

// Reward options: boss gets specific cards, everything else is random
// with no repeats within one set of choices
combat.rewardChoices = function (count, bossId) {
    if (bossId) {
        const bossCards = combat.bossRewardChoices(bossId);
        if (bossCards && bossCards.length) return bossCards;
    }

    const pool = SC.cards.filter(function (card) {
        return !card.demo && !card.hero && card.rarity !== 'Enemy' && card.rarity !== 'Legendary' &&!card.rewardOnly;
    });
    return shuffle(pool.slice()).slice(0, count).map(function (card) {
        return Object.assign({}, card);
    });
};
    SC.combat = combat;
})();