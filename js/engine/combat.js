/* =========================================================
   SUBSTITUTE CHAOS — COMBAT ENGINE
   =========================================================
   All the game rules and the game state. No drawing here;
   js/ui/battle.js reads SC.combat.state and draws it.

   Both sides work the same way:
     side = { sanity, maxSanity, relaxation, field: [defenders] }

   THE DAMAGE RULE
     1. Defenders on the target's field take hits first
     2. Whatever's left hits the hero; Relaxation absorbs it first
     3. Whatever's left after that comes off Sanity

   Relaxation goes away at the start of its owner's next turn.

   Effect types (matching js/content/cards.js):
     damage      deal damage to the other side
     multiplier  repeat the last damage (amount = total hits)
     block       gain Relaxation
     defender    put a defender on your field
     energy      gain Coffee
     draw        draw cards
     heal        restore Sanity
     shuffle     shuffle your discard pile back into your deck
     confiscate  card is removed for the rest of the fight
     power, status  not built yet (tonight's work)

   Main functions:
     SC.combat.start(levelId, heroId)
     SC.combat.playCard(handIndex)
     SC.combat.endTurn()
   ========================================================= */

window.SC = window.SC || {};

(function () {
    'use strict';

    SC.combat = { state: null };

    // ------- SETUP -------

    SC.combat.start = function (levelId, heroId) {
        const level = SC.levels[levelId];
        const enemyData = SC.enemies[level.enemy];

        const s = {
            level: level,
            turn: 1,
            result: null,   // 'win' or 'lose' when the fight ends

            player: {
                heroId: heroId || 'substitute-teacher',
                sanity: level.sanity,
                maxSanity: level.sanity,
                relaxation: 0,
                energy: level.energy,
                maxEnergy: level.energy,
                field: []
            },

            enemy: {
                id: enemyData.id,
                name: enemyData.name,
                art: enemyData.art,
                sanity: enemyData.sanity,
                maxSanity: enemyData.sanity,
                relaxation: 0,
                field: [],
                deck: enemyData.deck.map(function (id) { return SC.getCard(id); }).filter(Boolean),
                order: enemyData.order || 'inOrder',
                cardsPerTurn: enemyData.cardsPerTurn || 1,
                deckIndex: 0,
                next: []   // the cards it will play on its next turn (its intent)
            },

            drawPile: shuffle(buildStartingDeck(level)),
            hand: [],
            discard: [],
            confiscated: [],
            log: []
        };

        SC.combat.state = s;
        pickEnemyCards();
        drawCards(level.handSize);
        addLog(level.intro || 'The fight begins!');
        return s;
    };

    // Guaranteed cards first, then random player cards to fill the deck.
    // Hero/demo cards and Enemy cards are never in your deck.
    function buildStartingDeck(level) {
        const pool = SC.cards.filter(function (card) {
            return !card.demo && card.rarity !== 'Enemy';
        });

        const deck = (level.guaranteedCards || [])
            .map(function (id) { return SC.getCard(id); })
            .filter(Boolean);

        while (deck.length < level.deckSize && pool.length > 0) {
            deck.push(pool[Math.floor(Math.random() * pool.length)]);
        }

        return deck;
    }

    // ------- PLAYER CARDS -------

    function drawCards(count) {
        const s = SC.combat.state;

        for (let i = 0; i < count; i++) {
            // Out of cards: shuffle the discard pile back into the deck
            if (s.drawPile.length === 0) {
                if (s.discard.length === 0) {
                    return;
                }
                s.drawPile = shuffle(s.discard);
                s.discard = [];
                addLog('Reshuffled the discard pile.');
            }
            s.hand.push(s.drawPile.pop());
        }
    }

    SC.combat.playCard = function (handIndex) {
        const s = SC.combat.state;
        if (!s || s.result) {
            return false;
        }

        const card = s.hand[handIndex];
        if (!card) {
            return false;
        }

        if (card.cost > s.player.energy) {
            addLog('Not enough Coffee for ' + card.name + '.');
            return false;
        }

        s.player.energy -= card.cost;
        s.hand.splice(handIndex, 1);

        const outcome = resolveCard(card, 'player');

        if (outcome.confiscated) {
            s.confiscated.push(card);
        } else {
            s.discard.push(card);
        }

        checkResult();
        return true;
    };

    // ------- CARD EFFECTS (used by both sides) -------

    function resolveCard(card, ownerKey) {
        const s = SC.combat.state;
        const owner = s[ownerKey];
        const foe = ownerKey === 'player' ? s.enemy : s.player;
        const isPlayer = ownerKey === 'player';

        let lastDamage = 0;
        let confiscated = false;

        (card.effects || []).forEach(function (effect) {
            const amount = amountOf(effect.amount);

            switch (effect.type) {
                case 'damage':
                    lastDamage = amount;
                    hit(foe, amount);
                    addLog(card.name + ' dealt ' + amount + ' damage.');
                    break;

                case 'multiplier':
                    // "Deal 2 damage 4 times": damage already hit once, so hit (times - 1) more
                    for (let i = 1; i < amount; i++) {
                        hit(foe, lastDamage);
                    }
                    addLog(card.name + ' hit ' + amount + ' times.');
                    break;

                case 'block':
                    owner.relaxation += amount;
                    addLog(owner === s.player ? 'You gained ' + amount + ' Relaxation.'
                                              : s.enemy.name + ' gained ' + amount + ' Relaxation.');
                    break;

                case 'defender':
                    owner.field.push({
                        name: effect.name || card.name,
                        art: card.art,
                        sanity: amount,
                        maxSanity: amount
                    });
                    addLog((effect.name || card.name) + ' is guarding the field.');
                    break;

                case 'energy':
                    if (isPlayer) {
                        s.player.energy += amount;
                        addLog('Gained ' + amount + ' Coffee.');
                    }
                    break;

                case 'draw':
                    if (isPlayer) {
                        drawCards(amount);
                    }
                    break;

                case 'heal':
                    owner.sanity = Math.min(owner.maxSanity, owner.sanity + amount);
                    addLog('Healed ' + amount + ' Sanity.');
                    break;

                case 'shuffle':
                    if (isPlayer) {
                        s.drawPile = shuffle(s.drawPile.concat(s.discard));
                        s.discard = [];
                        addLog('Shuffled the discard pile into the deck.');
                    }
                    break;

                case 'confiscate':
                    confiscated = true;
                    break;

                default:
                    // power, status, and anything else not built yet
                    addLog('(' + card.name + ': "' + effect.type + '" is not built yet)');
            }
        });

        return { confiscated: confiscated };
    }

    // Amounts are usually numbers. A few cards use text,
    // like Bin Dump's 'player discard pile size'.
    function amountOf(value) {
        if (typeof value === 'number') {
            return value;
        }
        if (typeof value === 'string' && value.indexOf('discard') !== -1) {
            return SC.combat.state.discard.length;
        }
        return 0;
    }

    // ------- THE DAMAGE RULE -------

    function hit(target, amount) {
        let left = amount;

        // 1. Defenders take hits first (front of the field first)
        while (left > 0 && target.field.length > 0) {
            const defender = target.field[0];
            const absorbed = Math.min(defender.sanity, left);
            defender.sanity -= absorbed;
            left -= absorbed;

            if (defender.sanity <= 0) {
                target.field.shift();
                addLog(defender.name + ' was knocked off the field.');
            }
        }

        // 2. Relaxation absorbs what's left
        if (left > 0 && target.relaxation > 0) {
            const absorbed = Math.min(target.relaxation, left);
            target.relaxation -= absorbed;
            left -= absorbed;
        }

        // 3. The rest comes off Sanity
        if (left > 0) {
            target.sanity = Math.max(0, target.sanity - left);
        }
    }

    // ------- TURNS -------

    SC.combat.endTurn = function () {
        const s = SC.combat.state;
        if (!s || s.result) {
            return;
        }

        // Your unplayed cards go to the discard pile
        s.discard = s.discard.concat(s.hand);
        s.hand = [];

        enemyTurn();
        checkResult();
        if (s.result) {
            return;
        }

        // Start of your next turn
        s.turn++;
        s.player.relaxation = 0;   // Relaxation lasts one turn
        if (s.level.refillEnergy) {
            s.player.energy = s.player.maxEnergy;
        }
        drawCards(s.level.handSize);
    };

    function enemyTurn() {
        const s = SC.combat.state;
        const enemy = s.enemy;

        if (enemy.sanity <= 0) {
            return;
        }

        enemy.relaxation = 0;   // enemy Relaxation also lasts one turn

        enemy.next.forEach(function (card) {
            if (s.player.sanity <= 0) {
                return;
            }
            addLog(enemy.name + ' played ' + card.name + '.');
            resolveCard(card, 'enemy');
        });

        pickEnemyCards();
    }

    // Decide what the enemy plays next turn, so the screen can show it
    function pickEnemyCards() {
        const enemy = SC.combat.state.enemy;
        enemy.next = [];

        if (enemy.deck.length === 0) {
            return;
        }

        for (let i = 0; i < enemy.cardsPerTurn; i++) {
            if (enemy.order === 'random') {
                enemy.next.push(enemy.deck[Math.floor(Math.random() * enemy.deck.length)]);
            } else {
                enemy.next.push(enemy.deck[enemy.deckIndex % enemy.deck.length]);
                enemy.deckIndex++;
            }
        }
    }

    // ------- HELPERS -------

    function checkResult() {
        const s = SC.combat.state;
        if (s.enemy.sanity <= 0) {
            s.result = 'win';
        } else if (s.player.sanity <= 0) {
            s.result = 'lose';
        }
    }

    function addLog(text) {
        SC.combat.state.log.push(text);
    }

    function shuffle(list) {
        const copy = list.slice();
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = copy[i];
            copy[i] = copy[j];
            copy[j] = temp;
        }
        return copy;
    }

})();