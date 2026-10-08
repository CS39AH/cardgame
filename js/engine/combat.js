/* =========================================================
   SUBSTITUTE CHAOS — COMBAT ENGINE
   =========================================================
   All the fight rules. No drawing here; js/ui/battle.js
   reads SC.combat.state and draws it.

   SC.combat.start(levelId, heroId)  start a fight
   SC.combat.playCard(handIndex)     play a card, true if it worked
   SC.combat.endTurn()               discard hand, enemy plays, next turn

   Damage rule: defenders on the field take hits first, then
   Relaxation, then Sanity. Relaxation lasts until your next turn.

   Power cards stay in play (side.powers) and react to triggers:
     'playAttack'  owner played an Attack     (Teacher's Pet)
     'Attacked'    owner is hit by an attack  (Track Record, amount is negative)
     'Attacks'     owner's attacks get +amount (Pencil Sharpener)
   ========================================================= */

window.SC = window.SC || {};

(function () {
    'use strict';

    const combat = { state: null };

    // ------- START A FIGHT -------

    combat.start = function (levelId, heroId) {
        const level = SC.levels[levelId] || SC.levels.tutorial;
        const enemyDef = SC.enemies[level.enemy];

        const state = {
            level: level,
            turn: 1,
            result: null,              // 'win' or 'lose' when it's over

            player: {
                heroId: heroId,
                sanity: level.sanity,
                maxSanity: level.sanity,
                relaxation: 0,
                energy: level.energy,
                maxEnergy: level.energy,
                field: [],             // defenders
                powers: [],            // Power cards in play
                status: {}
            },

            enemy: {
                id: enemyDef.id,
                name: enemyDef.name,
                art: enemyDef.art,
                sanity: enemyDef.sanity,
                maxSanity: enemyDef.sanity,
                relaxation: 0,
                field: [],
                powers: [],
                status: {},
                deck: enemyDef.deck.map(copyCard).filter(Boolean),
                order: enemyDef.order || 'inOrder',
                cardsPerTurn: enemyDef.cardsPerTurn || 1,
                deckIndex: 0,
                next: []               // what it plays next turn (shown on screen)
            },

            drawPile: buildStartingDeck(level),
            hand: [],
            discard: [],
            confiscated: [],
            log: []
        };

        combat.state = state;

        addLog(level.intro || 'The fight begins!');
        drawCards(level.handSize);
        pickEnemyCards();

        return state;
    };

    // Tutorial: exact list in order. Real levels: random deck.
    function buildStartingDeck(level) {
        if (level.startingDeck) {
            const deck = level.startingDeck.map(copyCard).filter(Boolean);
            return level.shuffleDeck === false ? deck : shuffle(deck);
        }

        // Random: guaranteed cards plus random fill from the pool
        const pool = SC.cards.filter(function (card) {
            return !card.demo && !card.hero && card.rarity !== 'Enemy';
        });

        const deck = (level.guaranteedCards || []).map(copyCard).filter(Boolean);
        while (deck.length < (level.deckSize || 10) && pool.length) {
            const pick = pool[Math.floor(Math.random() * pool.length)];
            deck.push(copyCard(pick.id));
        }
        return shuffle(deck);
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

        if (card.cost > s.player.energy) {
            addLog('Not enough Coffee for ' + card.name + '.');
            return false;
        }

        s.player.energy -= card.cost;
        s.hand.splice(handIndex, 1);
        addLog('You played ' + card.name + '.');

        resolveCard(card, 'player');

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
            firePowers('player', 'playAttack');
        }

        checkResult();
        return true;
    };

    combat.endTurn = function () {
        const s = combat.state;
        if (!s || s.result) return;

        // Leftover hand goes to the discard pile
        while (s.hand.length) {
            s.discard.push(s.hand.shift());
        }

        enemyTurn();
        checkResult();
        if (s.result) return;

        // Your next turn
        s.turn += 1;
        s.player.relaxation = 0;               // Relaxation lasts one turn
        if (s.level.refillEnergy) {
            s.player.energy = s.player.maxEnergy;
        }
        drawCards(s.level.handSize);
        pickEnemyCards();
    };

    // ------- ENEMY -------

    function enemyTurn() {
        const s = combat.state;
        const enemy = s.enemy;

        enemy.relaxation = 0;                  // its Relaxation also lasts one turn

        enemy.next.forEach(function (card) {
            if (s.result) return;
            addLog(enemy.name + ' played ' + card.name + '.');
            resolveCard(card, 'enemy');

            if (card.type === 'Power') {
                enemy.powers.push(card);
            }
            if (isAttack(card) && card.type !== 'Power') {
                firePowers('enemy', 'playAttack');
            }
            checkResult();
        });

        enemy.next = [];
    }

    // Choose what the enemy plays next turn (shown as its intent)
    function pickEnemyCards() {
        const enemy = combat.state.enemy;

        // Powers it already has in play aren't played again
        const playable = enemy.deck.filter(function (card) {
            return !(card.type === 'Power' && enemy.powers.some(function (p) {
                return p.id === card.id;
            }));
        });

        enemy.next = [];
        if (!playable.length) return;

        for (let i = 0; i < enemy.cardsPerTurn; i++) {
            let card;
            if (enemy.order === 'random') {
                card = playable[Math.floor(Math.random() * playable.length)];
            } else {
                card = playable[enemy.deckIndex % playable.length];
                enemy.deckIndex += 1;
            }
            enemy.next.push(card);
        }
    }

    // ------- CARD EFFECTS -------

    // Runs every effect on a card for whoever played it
    function resolveCard(card, who) {
        const ctx = { lastDamage: 0 };
        (card.effects || []).forEach(function (effect) {
            resolveEffect(effect, who, card, ctx);
        });
    }

    function resolveEffect(effect, who, card, ctx) {
        const s = combat.state;
        const owner = sideOf(who);
        const foeWho = who === 'player' ? 'enemy' : 'player';
        const amount = amountOf(effect.amount);

        switch (effect.type) {
            case 'damage': {
                const total = Math.max(0, amount + attackBonus(who));
                hit(foeWho, total);
                ctx.lastDamage = total;
                break;
            }

            case 'multiplier':
                // "Deal 2 damage 3 times" = damage once, then repeat 2 more times
                for (let i = 1; i < amount && !s.result; i++) {
                    hit(foeWho, ctx.lastDamage);
                }
                break;

            case 'block':
                owner.relaxation += amount;
                break;

            case 'defender':
                owner.field.push({
                    name: effect.name || card.name,
                    art: effect.art || card.art,
                    sanity: amount,
                    maxSanity: amount
                });
                addLog((who === 'player' ? 'You put' : s.enemy.name + ' put') +
                    ' a ' + (effect.name || card.name) + ' on the field.');
                break;

            case 'energy':
                if (who === 'player') {
                    s.player.energy += amount;
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
        return 0;
    }

    // ------- DAMAGE -------

    // Defenders first, then Relaxation, then Sanity
    function hit(targetWho, amount) {
        const target = sideOf(targetWho);

        // Powers like Track Record soften every hit
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
        target.sanity = Math.max(0, target.sanity - amount);
    }

    // ------- POWERS -------

    // Run the inner effect of every Power with this trigger
    function firePowers(who, trigger) {
        const side = sideOf(who);
        side.powers.forEach(function (card) {
            (card.effects || []).forEach(function (effect) {
                if (effect.type === 'power' && effect.trigger === trigger && effect.effect) {
                    resolveEffect(effect.effect, who, card, { lastDamage: 0 });
                }
            });
        });
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
        return powerTotal(who, 'Attacks');
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

    SC.combat = combat;
})();