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
        imageScale: 1.4,
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
            'caffeine-drink',
            'stapler-shot',
            'desk-block',
            'whoopie-cushion',
            'desk-block',
            'caffeine-drink',
            'vitamins',
            'marker-saber'
        ]
    },
    'class-computer': {
        id: 'class-computer',
        name: 'Infected Computer',
        art: '🖥️',
        image: 'graphics/cards/infected-computer.png',
        imageScale: 1.5,
        sanity: 25,
        energy: 4,
        order: 'inOrder',
        shuffleEnemyDeck: true,
        startingDeck: [
            'critical-error',       
            'safeguard',             
            'cyber-wall',           
            'safeguard',   
            'restoring-data',   
            'increase-power',
            'restoring-data',
            'cyber-wall',
            'safeguard',
            'critical-error'
        ]
    },
    'marker-horde': {
        id: 'marker-horde',
        name: 'Horde of Markers',
        art: '🖊️🖊️🖊️🖊️🖊️',
        image: 'graphics/cards/marker-horde.png',
        imageScale: 1.5,
        sanity: 50,
        energy: 2,
        order: 'inOrder',
        shuffleEnemyDeck: true,
        startingDeck: [
            'marked-up',       
            'blackout',             
            'incorrect-strikes',           
            'blue-barrier',   
            'healing-green-ink',   
            'incorrect-strikes', 
            'incorrect-strikes', 
            'blue-barrier',
            'healing-green0ink',
            'incorrect-strikes'
        ]
    },

    //========== CAFETERIA ENEMIES ============
    'cafeteria-enemy': {
        id: 'cafeteria-enemy',
        name: 'Living Burnt Pizza',
        art: '🍕',
        image: 'graphics/cards/cafeteria/burnt_pizza.png',
        sanity: 30,
        energy: 3,
        order: 'inOrder',
        shuffleEnemyDeck: true,

        startingDeck: [
            'rotten-produce',
            'dirty-tray',
            'dirty-rag',
            'vengeful-leftovers',
            'spoiled-milk',
            'hardened-buns',
            'boiling-water',
            'hot-pan',
            'undercooked-meat',
            'sticky-juice-box',
            'evil-pizza-cutter',
            'large-frozen-buns-box',
            'inaccurate-probe-thermometer',
            'heavy-milk-container',
            'freezer-breeze',
            'malfunctioning-electric-can-opener',
            'wasted-napkins',
            'broken-oven-fan',
            'oven-heat',
            'infestation'
        ]

    },

    // ----- Cafeteria Zone 2: a group of students throwing food -----
    'cafeteria-food-fight-enemy': {
        id: 'cafeteria-food-fight-enemy',
        name: 'Food Fight Students',
        art: '🧒🧑🧒', 
        image: 'graphics/cards/cafeteria/food_fight_students.png',
        sanity: 50,
        energy: 3,
        order: 'inOrder',
        shuffleEnemyDeck: true,
        // Fast, disruptive attacks with a few lunch-tray defenses.
        // Leave oven-specific powers for the final Cafeteria encounter.
        startingDeck: [
            'rotten-produce',
            'rotten-produce',
            'hardened-buns',
            'hardened-buns',
            'sticky-juice-box',
            'sticky-juice-box',
            'evil-pizza-cutter',
            'evil-pizza-cutter',
            'dirty-tray',
            'dirty-tray',
            'wasted-napkins',
            'undercooked-meat',
            'heavy-milk-container',
            'vengeful-leftovers',
            'infestation'
        ]
    },

    // ----- Cafeteria Zone 3: final boss in the kitchen -----
    'cafeteria-oven-enemy': {
        id: 'cafeteria-oven-enemy',
        name: 'Evil Possessed Oven',
        art: '🔥', 
        image: 'graphics/cards/cafeteria/evil_possessed_oven.png',
        sanity: 80,
        energy: 3,
        order: 'inOrder',
        shuffleEnemyDeck: true,
        // Heat-heavy offense backed by Powers and kitchen-themed defenses.
        // Uses existing Cafeteria cards, so no new combat effects are needed.
        startingDeck: [
            'oven-heat',
            'infestation',
            'boiling-water',
            'boiling-water',
            'hot-pan',
            'hot-pan',
            'hot-pan',
            'evil-pizza-cutter',
            'evil-pizza-cutter',
            'large-frozen-buns-box',
            'heavy-milk-container',
            'inaccurate-probe-thermometer',
            'malfunctioning-electric-can-opener',
            'broken-oven-fan',
            'freezer-breeze',
            'undercooked-meat',
            'sticky-juice-box',
            'wasted-napkins'
        ]
    },

    // ----- Gym zone enemies (the boss is gym-enemy below) -----
    'gym-warmup-enemy': {
        id: 'gym-warmup-enemy',
        name: 'Runaway Jump Rope',
        art: '🪢',
        image: 'graphics/cards/jump_rope.png',
        sanity: 30,
        energy: 3,
        order: 'inOrder',
        shuffleEnemyDeck: true,
        startingDeck: [            // 7 cards
            'skip-slap',
            'skip-slap',
            'skip-slap',
            'tangle',
            'tangle',
            'medicine-ball',
            'water-break'
        ]
    },

    'gym-dodgeball-enemy': {
        id: 'gym-dodgeball-enemy',
        name: 'The Ball Cart',
        art: '🛒',
        sanity: 40,
        energy: 3,
        order: 'inOrder',
        shuffleEnemyDeck: true,
        startingDeck: [            // 15 cards
            'dodgeball-barrage',
            'dodgeball-barrage',
            'dodgeball-barrage',
            'dodgeball-barrage',
            'medicine-ball',
            'medicine-ball',
            'medicine-ball',
            'ball-avalanche',
            'ball-avalanche',
            'rolling-rack',
            'rolling-rack',
            'bleacher-wall',
            'bleacher-wall',
            'water-break',
            'water-break'
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
        startingDeck: [            // 20 cards
            'beep',                // 1 Coffee: deal 4
            'beep',
            'beep',
            'beep',
            'beep',
            'dodgeball-barrage',   // 2 Coffee: deal 2, three times
            'dodgeball-barrage',
            'dodgeball-barrage',
            'medicine-ball',       // 2 Coffee: deal 7
            'medicine-ball',
            'medicine-ball',
            'water-break',         // 1 Coffee: recover 5 Sanity
            'water-break',
            'water-break',
            'final-lap',           // 3 Coffee: deal 15
            'final-lap',
            'bleacher-wall',       // 1 Coffee: 6 Sanity defender
            'bleacher-wall',
            'level-up',            // 2 Coffee: Power, its Attacks +1 per hit
            'padded-walls'         // 2 Coffee: Power, takes 1 less per hit
        ]
    },

    // ----- Hallway zone enemies

    'hallway-enemy': {
        id: 'hallway-enemy',
        name: 'spilled-liquid',
        art: '🧹',
        image: 'graphics/cards/hallway/spill.jpg',
        sanity: 50,
        energy: 3,
        order: 'inOrder',
        shuffleEnemyDeck: true,
        startingDeck: [
            'mop',
            'broom',
            'dustpan',
            'locker',
            'trash-can'
        ]
    },
        'hallway-lockers-enemy': {
        id: 'hallway-lockers-enemy',
        name: 'The Locker',
        art: '🗄️',
        image: 'graphics/cards/hallway/locker.png',
        sanity: 60,
        energy: 3,
        order: 'inOrder',
        shuffleEnemyDeck: true,
        startingDeck: [
            'moldy-sandwich',       // 1 Coffee: 5 Sanity defender
            'combination-lock',
            'umbrella',
            'deodorant-spray',
            'trophy'
        ]
    },

    'hallway-boss-enemy': {
        id: 'hallway-boss-enemy',
        name: 'The Monitor',
        art: '🧑‍🏫',
        image: 'graphics/cards/hallway/hall-monitor.png',
        sanity: 70,
        energy: 3,
        order: 'inOrder',
        shuffleEnemyDeck: true,
        startingDeck: [
            'water-splash',       // 2 Coffee: deal 3, three times
            'water-bottle',
            'fire-extinguisher',
            'chewed-gum',
            'school-bell'
        ]
    },

        'library-returns-enemy': {
        id: 'library-returns-enemy',
        name: 'Overdue Book Stack',
        art: '📚',
        image: 'graphics/cards/library/overdue-book-stack.png',
        sanity: 40,
        energy: 3,
        order: 'inOrder',
        shuffleEnemyDeck: true,
        startingDeck: [
            'bookshelf-dominoes',
            'overdue-slip',
            'bookmark-barricade',
            'dust-cloud',
            'torn-pages'
        ]
    },

    'library-study-enemy': {
        id: 'library-study-enemy',
        name: 'Phone on Speaker',
        art: '📱',
        image: 'graphics/cards/library/phone-on-speaker.png',
        sanity: 55,
        energy: 3,
        order: 'inOrder',
        shuffleEnemyDeck: true,
        startingDeck: [
            'ringtone-blast',
            'notification-buzz',
            'autoplay-video',
            'power-bank',
            'group-chat-ping'
        ]
    },
    
    'library-enemy': {
    id: 'library-enemy',
    name: 'The Loud Whisperer',
    art: '📚',
    image: 'graphics/cards/library/loud-whisperer.png',
    sanity: 70,
    energy: 3,
    order: 'inOrder',
    shuffleEnemyDeck: true,
    startingDeck: [
        'paper-airplane-barrage',
        'snack-attack',
        'stink-bomb',
        'loud-clap',
        'gossip-with-friends',
        'headphones-on',
        'day-dreaming'
    ]
    },
    'mastermind': {
        id: 'mastermind',
        name: 'Robo Principal',
        art: '🤖',
        image: 'graphics/cards/robo-principal.png',
        imageScale: 1.2,
        sanity: 80,
        energy: 4,
        order: 'inOrder',
        shuffleEnemyDeck: true,
        startingDeck: [
            'blue-barrier',         //homeroom cards
            'scattered-pencils',
            'blackout',
            'marked-up',
            'critical-error',
            'vengeful-leftovers',   //lunchroom cards
            'spoiled-milk',
            'boiling-water',
            'undercooked-meat',
            'malfunctioning-electric-can-opener',
            'water-break',          //gym cards
            'level-up',
            'final-lap',
            'tangle',
            'ball-avalanche',
            'locker',               //hallway cards
            '',
            '',
            '',
            '',
            '', //library cards
            '',
            '',
            '',
            '',
        ]
    },
};