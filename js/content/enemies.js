/* =========================================================
   SUBSTITUTE CHAOS — ENEMIES
   =========================================================
   Each enemy has Sanity, Coffee (energy), and a deck of Enemy
   cards from js/content/cards.js (rarity: 'Enemy'). Every turn
   it plays cards from its deck until it runs out of Coffee,
   paying each card's cost just like the player does.

   order: 'inOrder' plays the deck top to bottom, then repeats
          (predictable, good for the tutorial)
          'random' picks a random card from the deck each time

   energy: Coffee it gets every turn (defaults to 3)
   ========================================================= */

window.SC = window.SC || {};

SC.enemies = {
    'class-clown-tutorial': {
        id: 'class-clown-tutorial',
        name: 'Class Clown',
        art: '🤡',
        sanity: 20,
        energy: 3,
        order: 'inOrder',
        startingDeck: [
            'stapler-shot',       // 1 Coffee: deal 2
            'eraser',             // 1 Coffee: gain 4 Relaxation
            'bin-dump',           // 1 Coffee: 1 damage per card in your discard pile
            'pencil-sharpener',   // 2 Coffee: Power, its attacks deal +1
            'scattered-pencils'   // 2 Coffee: deal 2, four times
        ]
    },
    'class-clown': {
        id: 'class-clown',
        name: 'Class Clown',
        art: '🤡',
        image: 'graphics/cards/class-clown.png',
        sanity: 40,
        energy: 3,
        order: 'inOrder',
        shuffleEnemyDeck: true,
        startingDeck: [
            'stapler-shot',       // 1 Coffee: deal 2
            'eraser',             // 1 Coffee: gain 4 Relaxation
            'bin-dump',           // 1 Coffee: 1 damage per card in your discard pile
            'pencil-sharpener',   // 2 Coffee: Power, its attacks deal +1
            'scattered-pencils',   // 2 Coffee: deal 2, four times
            'stapler-shot',
            'eraser',
            'bin-dump',
            'stapler-shot',
            'eraser'
        ]
    },

    'cafeteria-enemy': {
        id: 'cafeteria-enemy',
        name: 'Living Burnt Pizza',
        art: '🍕',
        image: 'graphics/cards/cafeteria/burnt_pizza.png',
        sanity: 80,
        energy: 3,
        order: 'inOrder',
        
        startingDeck: [
            'rotten-produce',
            'dirty-tray',
            'dirty-rag',
            'vengeful-leftovers',
            'spoiled-milk'
        ]

    },

    'gym-enemy': {
        id: 'gym-enemy',
        name: 'The PACER Test',
        art: '⏱️',
        image: 'graphics/cards/pacer_test.jpg',
        sanity: 60,
        energy: 3,
        order: 'inOrder',
        shuffleEnemyDeck: true,
        startingDeck: [
            'dodgeball-barrage',   // 2 Coffee: deal 2, three times
            'dodgeball-barrage',
            'medicine-ball',       // 2 Coffee: deal 7
            'medicine-ball',
            'bleacher-wall',       // 1 Coffee: 6 Sanity defender
            'padded-walls',        // 2 Coffee: Power, takes 1 less per hit
            'water-break'          // 1 Coffee: recover 5 Sanity
        ]
    }
};