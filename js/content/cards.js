/* =========================================================
   SUBSTITUTE CHAOS — CARD DATA
   =========================================================
   Every card in the game lives in this list. The UI reads
   the display fields (name, cost, type, art, description),
   and the engine will read the effects list.

   To add a card, copy an entry and change the values.
   id must be unique and lowercase-with-dashes.
   ========================================================= */

window.SC = window.SC || {};

SC.cards = [
    {
        id: 'pencil-of-destiny',
        name: 'Pencil of Destiny',
        cost: 2,
        type: 'Attack',
        rarity: 'Rare',
        art: '✏️',                                        // fallback if the image is missing
        image: 'graphics/cards/pencilofdestiny.png',
        imageAlt: 'An ornate golden pencil with a glowing blue gem',
        imageRotate: 75,
        imageScale: 1.5,
        description: 'Deal 10 damage. Draw 1 card.',
        effects: [
            { type: 'damage', amount: 10 },
            { type: 'draw', amount: 1 }
        ]
    },
    
    {
        id: 'golden-apple',
        name: 'The Golden Apple',
        cost: 2,
        type: 'Defense',
        rarity: 'Legendary',
        art: '🍎',                                    // fallback if the image is missing
        image: 'graphics/cards/goldenapple.png',
        imageAlt: 'A polished golden apple with one bite taken out',
        imageAlt: 'A polished golden apple with one bite taken out',
        imageScale: 1.8,
        description: 'Heal 15 Sanity. Gain 15 Relaxation. Confiscated.',
        effects: [
            { type: 'heal', amount: 15 },
            { type: 'block', amount: 15 },
            { type: 'confiscate' }
        ]
    },
    {
        id: 'yard-stick',
        name: "Yard Stick",
        cost: 2,
        type: 'Power',
        rarity: 'Legendary',
        art: '📏',                                    // fallback if the image is missing
        image: 'graphics/cards/yard-stick.png',
        imageAlt: 'a yard stick in the room',
        imageScale: 1.0,
        description: 'Whenever you play an Attack card, the Yard Stick deals 3 more damage.',
        effects: [
            { type: 'power', trigger: 'playAttack', effect: { type: 'damage', amount: 3 } }
        ]
    },
    {
        id: 'dismissal-bell',
        name: "Dismissal Bell",
        cost: 2,
        type: 'Attack',
        rarity: 'Legendary',
        art: '🔔',                                    // fallback if the image is missing
        image: 'graphics/cards/dismissal-bell.png',
        imageAlt: 'a dismissal bell for the class',
        imageScale: 1.0,
        description: 'Bell rings causing 5 damage 3 times.',
        effects: [
            { type: 'damage', amount: 5},
            { type: 'multiplier', amount: 3}
        ]
    },

        {
        id: 'teachers-pet',
        name: "Teacher's Pet",
        cost: 1,
        type: 'Power',
        rarity: 'Uncommon',
        art: '🐹',                                    // fallback if the image is missing
        image: 'graphics/cards/teacherspet.png',
        imageAlt: 'The class hamster',
        imageScale: 1.8,
        description: 'Whenever you play an Attack card, Teacher\'s Pet deals 1 damage.',
        // Sounds when this Power jumps out to attack (names from SOUNDS in audio.js)
        attackSounds: { jump: 'petJump', hit: 'spearStab' },
        effects: [
            { type: 'power', trigger: 'playAttack', effect: { type: 'damage', amount: 1 } }
        ]
    },

        {
        id: 'red-pen-markup',
        name: 'Red Pen Markup',
        cost: 1,
        type: 'Attack',
        rarity: 'Common',
        art: '🖊️',                                   // fallback if the image is missing
        image: 'graphics/cards/redpen.png',
        imageAlt: 'A red pen with its cap off next to a red X',
        imageScale: 1.8,
        description: 'Deal 6 damage.',
        effects: [
            { type: 'damage', amount: 6 },
            { type: 'status', status: 'calledOut', amount: 1 }
        ]
    },
   {
        id: 'worksheets',
        name: 'Worksheets',
        cost: 2,
        type: 'Attack',
        rarity: 'Uncommon',
        art: '🧾x3',                                   // fallback if the image is missing
        image: 'graphics/cards/worksheets.png',
        imageAlt: 'A group of papers bound together by a staple',
        imageScale: 1.0,
        description: 'Deal 2 damage 3 times',
        effects: [
            { type: 'damage', amount: 2},
            { type: 'multiplier', amount: 3}
        ]
    },

     {
        id: 'morning-coffee',
        name: 'Morning Coffee',
        cost: 1,
        type: 'Defense',
        rarity: 'Common',
        art: '☕',                                   // fallback if the image is missing
        image: 'graphics/cards/coffee.png',
        imageAlt: 'a regular mug of coffee',
        imageScale: 1.0,
        description: 'Gain 5 relaxation',
        effects: [
            {type: 'block', amount: 5}
        ]
    },
        {
        id: 'desk-key',
        name: 'Desk key',
        cost: 1,
        type: 'Skill',
        rarity: 'Common',
        art: '🔑',                                   // fallback if the image is missing
        image: 'graphics/cards/desk_key.png',
        imageAlt: 'A key to the teacher\'s desk',
        imageScale: 1.0,
        description: 'Draw another card',
        effects: [
            {type: 'draw', amount: 1}
        ]
    },
        {
        id: 'track-record',
        name: 'Track Record',
        cost: 1,
        type: 'Power',
        rarity: 'Rare',
        art: '🧾',                                   // fallback if the image is missing
        image: 'graphics/cards/track_record.png',
        imageAlt: 'Proof of good performance as a substitute',
        imageScale: 1.0,
        description: 'Whenever you are hit by an Attack, Mitigate 1 damage',
        effects: [
            { type: 'power', trigger: 'Attacked', effect: { type: 'damage', amount: -1 } }
        ]
    },
        {
        id: 'lesson-plan',
        name: 'Lesson Plan',
        cost: 1,
        type: 'Skill',
        rarity: 'Common',
        art: '📁',                                   // fallback if the image is missing
        image: 'graphics/cards/lesson_plan.png',
        imageAlt: 'A folder with the lesson plan left by the teacher',
        imageScale: 1.0,
        description: 'Take your discard pile and shuffle it into your deck.',
        effects: [
            {type: 'shuffle', amount: 'deck'}
        ]
    },
   
    {   // Cafeteria related cards.
        id: 'fresh-fruits',
        name: 'Fresh Fruits',
        cost: 1,
        type: 'Skill',
        rarity: 'Common',
        art: '🍎',                                  // fallback if the image is missing
        image: 'graphics/cards/cafeteria/fresh_fruits.png',
        description: 'Recover 4 Sanity. Gain 1 Coffee.',
        effects: [
            { type: 'heal', amount: 4 },
            { type: 'energy', amount: 1 }
        ]
    },
    {
        id: 'chocolate-milk',
        name: 'Chocolate Milk',
        cost: 1,
        type: 'Skill',
        rarity: 'Common',
        art: '🥛',                                   // fallback if the image is missing
        image: 'graphics/cards/cafeteria/chocolate_milk.png',
        description: 'Gain 2 Coffee. Draw 1 card.',
        effects: [
            { type: 'energy', amount: 2 },
            { type: 'draw', amount: 1 }
        ]
    },
    {
        id: 'protective-apron',
        name: 'Protective Apron',
        cost: 2,
        type: 'Power',
        rarity: 'Uncommon',
        art: '🥼',                                  // fallback if the image is missing
        image: 'graphics/cards/cafeteria/protective_apron.png',
        description: 'Whenever you play a Defense card, gain 2 Relaxation.',
        effects: [
            {
                type: 'power',
                trigger: 'playDefense',
                effect: {
                    type: 'block',
                    amount: 2
                }
            }
        ]
    },
    {
        id: 'serving-spoon',
        name: 'Serving Spoon',
        cost: 2,
        type: 'Attack',
        rarity: 'Rare',
        art: '🥄',                                  // fallback if the image is missing
        image: 'graphics/cards/cafeteria/serving_spoon.png',
        description: 'Deal 6 damage. Heal for half the Sanity damage dealt.',
        effects: [
            { type: 'damage', amount: 6 },
            { type: 'lifesteal', fraction: 0.5 }
        ]
    },
    {
        id: 'clean-tray',
        name: 'Clean Tray',
        cost: 1,
        type: 'Defense',
        rarity: 'Uncommon',
        art: '🍽️',                                  // fallback if the image is missing
        image: 'graphics/cards/cafeteria/clean_tray.png',
        description: 'Place a 6 Sanity defender. While active, your attacks deal +1 damage.',
        effects: [
            {
                type: 'defender',
                amount: 6,
                name: 'Clean Tray',
                art: '🍽️',
                attackBonus: 1
            }
        ]
    },

    // ---------- CAFETERIA DUTY: Legendary boss rewards ----------
    {
        id: 'golden-spork',
        name: 'The Golden Spork',
        cost: 2,
        type: 'Power',
        rarity: 'Legendary',
        rewardOnly: true,
        art: '🍴',
        image: 'graphics/cards/cafeteria/golden_spork.png',
        imageAlt: 'A magical golden spork.',
        description: 'When an Attack card damages enemy Sanity, heal 2 Sanity.',
        effects: [
            { type: 'power', trigger: 'directSanityAttack', effect: { type: 'heal', amount: 2 } }
        ]
    },
    {
        id: 'bottomless-chocolate-milk',
        name: 'Bottomless Chocolate Milk',
        cost: 2,
        type: 'Skill',
        rarity: 'Legendary',
        rewardOnly: true,
        art: '🥛',
        image: 'graphics/cards/cafeteria/bottomless_chocolate_milk.png',
        imageAlt: 'An overflowing magical chocolate milk carton.',
        description: 'Gain 3 Coffee. Draw 2 cards.',
        effects: [
            { type: 'energy', amount: 3 },
            { type: 'draw', amount: 2 }
        ]
    },
    {
        id: 'lunch-ladys-legendary-special',
        name: "Lunch Lady's Legendary Special",
        cost: 3,
        type: 'Skill',
        rarity: 'Legendary',
        rewardOnly: true,
        art: '🍱',
        image: 'graphics/cards/cafeteria/lunch_ladys_special.png',
        imageAlt: 'A gourmet meal served on a cafeteria tray.',
        description: 'Recover 10 Sanity. Gain 8 Relaxation.',
        effects: [
            { type: 'heal', amount: 10 },
            { type: 'block', amount: 8 }
        ]
    },

    //marker horde cards
    {
        id: 'blue-barrier',
        name: 'Blue Barrier',
        cost: 2,
        type: 'Defense',
        rarity: 'Enemy',
        art: '🛡️',                                   // fallback if the image is missing
        image: 'graphics/cards/blue-barrier.jpg',
        imageAlt: 'A shielding blue marker.',
        imageScale: 1.2,
        description: 'Gain a 10 sanity barrier',
        effects: [
            { type: 'defender', amount: 10, name: 'Blue Barrier', art: '🛡️' }
        ]
    },
    {
        id: 'healing-green-ink',
        name: 'Healing Green Ink',
        cost: 1,
        type: 'Defense',
        rarity: 'Enemy',
        art: '💚',                                   // fallback if the image is missing
        image: 'graphics/cards/healing-green-ink.jpg',
        imageAlt: 'Green marker with a glowing aura.',
        imageScale: 1.2,
        description: 'Restore 5 sanity',
        effects: [
            {type: 'heal', amount: 5}
        ]
    },
    {
        id: 'marked-up',
        name: 'Marked Up',
        cost: 2,
        type: 'Power',
        rarity: 'Enemy',
        art: '👍',                                   // fallback if the image is missing
        image: 'graphics/cards/marked-up.jpg',
        imageAlt: 'Purple marker with 3 +1',
        imageScale: 1.2,
        description: '+1 to sanity and relaxation when you play a Defense Card. +1 to Attack Cards.',
        effects: [
            { type: 'power', trigger: 'playAttack', effect: { type: 'damage', amount: 1 } },
            { type: 'power', trigger: 'playDefense', effect: { type: 'block', amount: 1 } },
            { type: 'power', trigger: 'playDefense', effect: { type: 'heal', amount: 1 } }
        ]
    },
    {
        id: 'incorrect-strikes',
        name: 'Incorrect Strikes',
        cost: 0,
        type: 'Attack',
        rarity: 'Enemy',
        art: '❌',                                   // fallback if the image is missing
        image: 'graphics/cards/incorrect-strikes.jpg',
        imageAlt: 'Red marker with 3 Xs',
        imageScale: 1.2,
        description: 'Deal 1 damage 6 times',
        effects: [
            {type: 'damage', amount: 1},
            { type: 'multiplier', amount: 6}
        ]
    },
    {
        id: 'blackout',
        name: 'Blackout',
        cost: 2,
        type: 'Power',
        rarity: 'Enemy',
        art: '⚫',                                   // fallback if the image is missing
        image: 'graphics/cards/blackout.jpg',
        imageAlt: 'A black marker censoring stuff.',
        imageScale: 1.2,
        description: 'Mitigate damage taken by 1',
        effects: [
            { type: 'power', trigger: 'Attacked', effect: { type: 'damage', amount: -1 } }
        ]
    },

    //infected computer cards
    {
        id: 'restoring-data',
        name: 'Restoring Data',
        cost: 2,
        type: 'Defense',
        rarity: 'Enemy',
        art: '⚫',                                   // fallback if the image is missing
        image: 'graphics/cards/restoring-data.jpg',
        imageAlt: 'A black marker censoring stuff.',
        imageScale: 1.4,
        description: 'Restores 10 sanity',
        effects: [
            { type: 'heal', amount: 10 }
        ]
    },
    {
        id: 'safeguard',
        name: 'Safeguard',
        cost: 1,
        type: 'Defense',
        rarity: 'Enemy',
        art: '⚫',                                   // fallback if the image is missing
        image: 'graphics/cards/safeguard.jpg',
        imageAlt: 'a shield on a monitor.',
        imageScale: 1.4,
        description: 'gain 5 relaxation',
        effects: [
            { type: 'block',  amount: 5  }
        ]
    },
    {
        id: 'critical-error',
        name: 'Critical Error',
        cost: 2,
        type: 'Attack',
        rarity: 'Enemy',
        art: '⚫',                                   // fallback if the image is missing
        image: 'graphics/cards/critical-error-screen.jpg',
        imageAlt: 'A screen with an error message.',
        imageScale: 1.4,
        description: 'Deal 10 damage',
        effects: [
            { type: 'damage', amount: 10 }
        ]
    },
    {
        id: 'increase-power',
        name: 'Leveled Up',
        cost: 3,
        type: 'Power',
        rarity: 'Enemy',
        art: '⚫',                                   // fallback if the image is missing
        image: 'graphics/cards/increased-power.jpg',
        imageAlt: 'computer screen with a level up message.',
        imageScale: 1.4,
        description: 'increase damage daelt by Attack cards by 3',
        effects: [
             { type: 'power', trigger: 'playAttack', effect: { type: 'damage', amount: 3 } }
        ]
    },
    {
        id: 'cyber-wall',
        name: 'Blackout',
        cost: 3,
        type: 'Defense',
        rarity: 'Enemy',
        art: '⚫',                                   // fallback if the image is missing
        image: 'graphics/cards/cyber-wall.jpg',
        imageAlt: 'A digital wall',
        imageScale: 1.4,
        description: 'add a defender with 5 sanity',
        effects: [
            { type: 'defender', amount: 20, name: 'Blue Barrier', art: '🛡️' }
        ]
    },

    //class-clown cards
    {
        id: 'stapler-shot',
        name: 'Stapler Shot',
        cost: 1,
        type: 'Attack',
        rarity: 'Enemy',
        art: '🗜️',                                   // fallback if the image is missing
        image: 'graphics/cards/stapler_shot.png',
        imageAlt: 'A stapler shooting a staple.',
        imageScale: 1.0,
        description: 'Deal 2 damage',
        effects: [
            {type: 'damage', amount: 2}
        ]
    },

        {
        id: 'pencil-sharpener',
        name: 'Pencil Sharpener',
        cost: 2,
        type: 'Power',
        rarity: 'Enemy',
        art: '🦈',                                   // fallback if the image is missing
        image: 'graphics/cards/pencil_sharpener.png',
        imageAlt: 'A pencil sharpener.',
        imageScale: 1.0,
        description: 'Increase all damage by 1',
        effects: [
            { type: 'power', trigger: 'Attacks', effect: { type: 'damage', amount: 1 } }
        ]
    },
        {
        id: 'scattered-pencils',
        name: 'Scattered Pencils',
        cost: 2,
        type: 'Attack',
        rarity: 'Enemy',
        art: '✏️✏️✏️✏️',                                   // fallback if the image is missing
        image: 'graphics/cards/scattered_pencils.png',
        imageAlt: 'A collection of pencils.',
        imageScale: 1.0,
        description: 'Deal 2 damage 4 times',
        effects: [
            {type: 'damage', amount: 2},
            {type: 'multiplier', amount: 4}
        ]
    },
        {
        id: 'eraser',
        name: 'Eraser',
        cost: 1,
        type: 'Defense',
        rarity: 'Enemy',
        art: '❌',                                   // fallback if the image is missing
        image: 'graphics/cards/eraser.png',
        imageAlt: 'An Erasure.',
        imageScale: 1.0,
        description: 'gain 4 Relaxation',
        effects: [
            {type: 'block', amount: 4}
        ]
    },
        {
        id: 'bin-dump',
        name: 'Bin Dump',
        cost: 1,
        type: 'Attack',
        rarity: 'Enemy',
        art: '🗑️',                                   // fallback if the image is missing
        image: 'graphics/cards/paper_bin.png',
        imageAlt: 'A spilt over paper bin.',
        imageScale: 1.0,
        description: 'Deal 1 damage per card played by player',
        effects: [
            // 1 damage, once for every card you played on your turn
            { type: 'damage', amount: 1, times: 'cards played by player' }
        ]
    },
    {
        id: 'marker-saber',
        name: 'Marker Saber',
        cost: 2,
        type: 'Attack',
        rarity: 'Enemy',
        art: '⚔️',                                   // fallback if the image is missing
        image: 'graphics/cards/marker_saber.jpg',
        imageAlt: 'A bunch of markers combined into one long stick.',
        imageScale: 1.0,
        description: 'Deal 10 damage',
        effects: [
            {type: 'damage', amount: 10}
        ]
    },
    {
        id: 'vitamins',
        name: 'Vitamins',
        cost: 1,
        type: 'Defense',
        rarity: 'Enemy',
        art: '💊',                                   // fallback if the image is missing
        image: 'graphics/cards/vitamin.jpg',
        imageAlt: 'Some vitamins to consume.',
        imageScale: 1.0,
        description: 'Restore 5 sanity',
        effects: [
            {type: 'heal', amount: 5}
        ]
    },
    {
        id: 'caffeine-drink',
        name: 'Caffeine Drink',
        cost: 0,
        type: 'Skill',
        rarity: 'Enemy',
        art: '🍾',                                   // fallback if the image is missing
        image: 'graphics/cards/caffeine_drink.jpg',
        imageAlt: 'An energy drink.',
        imageScale: 1.0,
        description: 'Gain 1 energy',
        effects: [
            {type: 'energy', amount: 1}
        ]
    },
    {
        id: 'whoopie-cushion',
        name: 'Whoopie Cushion',
        cost: 1,
        type: 'Power',
        rarity: 'Enemy',
        art: '🎈',                                   // fallback if the image is missing
        image: 'graphics/cards/whoopie_cushion.jpg',
        imageAlt: 'A whoopie cushion.',
        imageScale: 1.0,
        description: 'When attacked mitigate 1 damage. When playing a defense card gain 1 relaxation.',
        effects: [
            { type: 'power', trigger: 'Attacked', effect: { type: 'damage', amount: -1 } },
            { type: 'power', trigger: 'playDefense', effect: { type: 'block', amount: 1 } },
        ]
    },
    {
        id: 'desk-block',
        name: 'Desk Block',
        cost: 2,
        type: 'Defense',
        rarity: 'Enemy',
        art: '🟫',                                   // fallback if the image is missing
        image: 'graphics/cards/desk_block.jpg',
        imageAlt: 'A desk defender',
        imageScale: 1.0,
        description: 'Summon a desk to defend with sanity 15',
        effects: [
            { type: 'defender', amount: 15, name: 'Desk', art: '🟫' }
        ]
    },

    {   // Cafeteria related enemy cards.
        id: 'rotten-produce',
        name: 'Rotten Produce',
        cost: 1,
        type: 'Attack',
        rarity: 'Enemy',
        art: '🍅',                                  // fallback if the image is missing
        image: 'graphics/cards/cafeteria/rotten_produce.png',
        description: 'Deal 1 damage twice.',
        effects: [
            { type: 'damage', amount: 1 },
            { type: 'multiplier', amount: 2 }
        ]
    },
    {
        id: 'dirty-tray',
        name: 'Dirty Tray',
        cost: 1,
        type: 'Defense',
        rarity: 'Enemy',
        art: '🍽️',                                  // fallback if the image is missing
        image: 'graphics/cards/cafeteria/dirty_tray.png',
        description: 'Gain 5 Relaxation.',
        effects: [
            { type: 'block', amount: 5 }
        ]
    },
    {
        id: 'dirty-rag',
        name: 'Dirty Rag',
        cost: 2,
        type: 'Power',
        rarity: 'Enemy',
        art: '🧽',                                  // fallback if the image is missing
        image: 'graphics/cards/cafeteria/dirty_rag.png',
        description: 'All future attacks deal +1 damage.',
        effects: [
            {
                type: 'power',
                trigger: 'Attacks',
                effect: {
                    type: 'damage',
                    amount: 1
                }
            }
        ]
    },
    {
        id: 'vengeful-leftovers',
        name: 'Vengeful Leftovers',
        cost: 2,
        type: 'Attack',
        rarity: 'Enemy',
        art: '🥘',                                  // fallback if the image is missing
        image: 'graphics/cards/cafeteria/vengeful_leftovers.png',
        description: 'Deal 6 damage. Recover 4 Sanity.',
        effects: [
            { type: 'damage', amount: 6 },
            { type: 'heal', amount: 4 }
        ]
    },  
    {
        id: 'spoiled-milk',
        name: 'Spoiled Milk',
        cost: 1,
        type: 'Skill',
        rarity: 'Enemy',
        art: '🥛',                                  // fallback if the image is missing
        image: 'graphics/cards/cafeteria/spoiled_milk.png',
        description: 'Reduce the player\'s Coffee by 1 next turn.',
        effects: [
            { type: 'reduceNextTurnEnergy', amount: 1 }
        ]
    },

    

    

    // ---------- GYM CLASS: player bonus cards ----------
    {
        id: 'basketball-pass',
        name: 'Basketball Pass',
        cost: 1,
        type: 'Attack',
        rarity: 'Common',
        art: '🏀',
        description: 'Deal 4 damage. Draw 1 card.',
        effects: [
            { type: 'damage', amount: 4 },
            { type: 'draw', amount: 1 }
        ]
    },
    {
        id: 'sports-drink',
        name: 'Sports Drink',
        cost: 0,
        type: 'Skill',
        rarity: 'Uncommon',
        art: '🧃',
        description: 'Gain 1 Coffee. Recover 2 Sanity.',
        effects: [
            { type: 'energy', amount: 1 },
            { type: 'heal', amount: 2 }
        ]
    },
    {
        id: 'stacked-mats',
        name: 'Stacked Mats',
        cost: 2,
        type: 'Defense',
        rarity: 'Uncommon',
        art: '🟦',
        description: 'Place a 10 Sanity defender.',
        effects: [
            { type: 'defender', amount: 10, name: 'Stacked Mats', art: '🟦' }
        ]
    },
    {
        id: 'running-shoes',
        name: 'Running Shoes',
        cost: 1,
        type: 'Skill',
        rarity: 'Common',
        art: '👟',
        description: 'Draw 2 cards.',
        effects: [
            { type: 'draw', amount: 2 }
        ]
    },
    {
        id: 'team-spirit',
        name: 'Team Spirit',
        cost: 2,
        type: 'Power',
        rarity: 'Uncommon',
        art: '📣',
        description: 'Whenever you play an Attack card, gain 2 Relaxation.',
        effects: [
            { type: 'power', trigger: 'playAttack', effect: { type: 'block', amount: 2 } }
        ]
    },

    // ---------- GYM CLASS: enemy cards ----------
    {
        id: 'dodgeball-barrage',
        name: 'Dodgeball Barrage',
        cost: 2,
        type: 'Attack',
        rarity: 'Enemy',
        art: '🔴',
        description: 'Deal 2 damage 3 times.',
        effects: [
            { type: 'damage', amount: 2 },
            { type: 'multiplier', amount: 3 }
        ]
    },
    {
        id: 'medicine-ball',
        name: 'Medicine Ball',
        cost: 2,
        type: 'Attack',
        rarity: 'Enemy',
        art: '🏐',
        description: 'Deal 7 damage.',
        effects: [
            { type: 'damage', amount: 7 }
        ]
    },
    {
        id: 'bleacher-wall',
        name: 'Bleacher Wall',
        cost: 1,
        type: 'Defense',
        rarity: 'Enemy',
        art: '🪜',
        description: 'Place a 6 Sanity defender.',
        effects: [
            { type: 'defender', amount: 6, name: 'Bleachers', art: '🪜' }
        ]
    },
    {
        id: 'padded-walls',
        name: 'Padded Walls',
        cost: 2,
        type: 'Power',
        rarity: 'Enemy',
        art: '🧱',
        description: 'Take 1 less damage from every hit.',
        effects: [
            { type: 'power', trigger: 'Attacked', effect: { type: 'damage', amount: -1 } }
        ]
    },
    {
        id: 'water-break',
        name: 'Water Break',
        cost: 1,
        type: 'Skill',
        rarity: 'Enemy',
        art: '💧',
        description: 'Recover 5 Sanity.',
        effects: [
            { type: 'heal', amount: 5 }
        ]
    },

    // ---------- HALLWAY: enemy cards ----------
    {
        id: 'mop',
        name: 'Mop',
        cost: 1,
        type: 'Attack',
        rarity: 'Enemy',
        art: '🧼',
        image: 'graphics/cards/mop.jpg',
        description: 'Deal 3 damage.',
        effects: [
            { type: 'damage', amount: 3 }
        ]
    },

    {
        id: 'broom',
        name: 'Broom',
        cost: 1,
        type: 'Attack',
        rarity: 'Enemy',
        art: '🧹',
        image: 'graphics/cards/broom.jpg',
        description: 'Deal 2 damage.',
        effects: [
            { type: 'damage', amount: 2 }
        ]
    },

    {
        id: 'dustpan',
        name: 'Dustpan',
        cost: 1,
        type: 'Defense',
        rarity: 'Enemy',
        art: '🧹',
        image: 'graphics/cards/dustpan.jpg',
        description: 'Gain 4 Relaxation.',
        effects: [
            { type: 'block', amount: 4 }
        ]
    },

    {
        id: 'locker',
        name: 'Locker',
        cost: 2,
        type: 'Defense',
        rarity: 'Enemy',
        art: '🚪',
        image: 'graphics/cards/evil-locker.jpg',
        description: 'Place a 5 Sanity defender.',
        effects: [
            { type: 'defender', amount: 5, name: 'Locker', art: '🚪' }
        ]
    },

    {
        id: 'trash-can',
        name: 'Trash Can',
        cost: 1,
        type: 'Attack',
        rarity: 'Enemy',
        art: '🗑️',
        image: 'graphics/cards/evil-trashcan.jpg',
        description: 'Deal 1 damage.',
        effects: [
            { type: 'damage', amount: 1 }
        ]
    },

    // --------- Hallway: player bonus cards ----------
    {
        id: 'wet-floor-sign',
        name: 'Wet Floor Sign',
        cost: 1,
        type: 'Defense',
        rarity: 'Rare',
        art: '⚠️',
        image: 'graphics/cards/wet-floor-sign.jpg',
        description: 'Gain 10 Relaxation.',
        effects: [
            { type: 'block', amount: 10 }
        ]
    },

    {
        id: 'disinfectant-spray',
        name: 'Disinfectant Spray',
        cost: 1,
        type: 'Skill',
        rarity: 'Common',
        art: '🧴',
        image: 'graphics/cards/disinfectant-spray.jpg',
        description: 'Recover 4 Sanity.',
        effects: [
            { type: 'heal', amount: 4 }
        ]
    },

    {
        id: 'janitor-key',
        name: 'Janitor Key',
        cost: 1,
        type: 'Skill',
        rarity: 'Common',
        art: '🗝️',
        image: 'graphics/cards/janitor-keys.jpg',
        description: 'Draw 2 cards.',
        effects: [
            { type: 'draw', amount: 2 }
        ]
    },

    {
        id: 'vacuum',
        name: 'Vacuum',
        cost: 2,
        type: 'Attack',
        rarity: 'Common',
        art: '🧹',
        image: 'graphics/cards/vacuum.jpg',
        description: 'Deal 4 damage.',
        effects: [
            { type: 'damage', amount: 4 }
        ]
    },

    {
        id: 'gloves',
        name: 'Gloves',
        cost: 1,
        type: 'Attack',
        rarity: 'Uncommon',
        art: '🧤',
        image: 'graphics/cards/gloves.jpg',
        description: 'Deal 4 damage.',
        effects: [
            { type: 'damage', amount: 4 }
        ]
    },

    
    {
        // Title screen showcase only. demo: true keeps it off the Cards board.
        id: 'substitute-teacher',
        name: 'Substitute Teacher',
        cost: 2,
        type: 'Attack',
        art: '🧑‍🏫',                                  // fallback if the image is missing
        image: 'graphics/cards/teacher.png',
        imageAlt: 'The substitute teacher',
        imageScale: 1.1,
        description: 'Deal 20 damage.',
        demo: true,
        hero: true,
        startingSanity: 30,
        startingEnergy: 3,
        startingDeck: [
            'pencil-of-destiny',
            'teachers-pet',
            'red-pen-markup',
            'morning-coffee',
            'worksheets',
            'desk-key',
            'lesson-plan',
            'track-record',
            'backpack-wall',
            'backpack-wall',
            'coffee-refill'

        ],
        badgeText: 'Staff · Substitute',
        badgeColor: '#b92626',
        effects: [
            { type: 'damage', amount: 20 }
        ]
    },

    {
        id: 'janitor',
        name: 'Janitor',
        cost: 1,
        type: 'Skill',
        art: '🧹',
        image: 'graphics/cards/janitor.png',
        imageAlt: 'The school janitor',
        imageScale: 1.1,
        description: 'Gain 8 Relaxation. Draw 1 card.',
        demo: true,
        hero: true,
        startingSanity: 30,
        startingEnergy: 3,
        startingDeck: [
            'wet-floor-sign',
            'disinfectant-spray',
            'janitor-key',
            'vacuum',
            'gloves',
            'gloves',
            'wet-floor-sign',
            'disinfectant-spray',
            'disinfectant-spray',
            'janitor-key',
        ],
        badgeText: 'Staff · Janitor',
        badgeColor: '#4f6f81',
        effects: [
            { type: 'block', amount: 8 },
            { type: 'draw', amount: 1 }
        ]
    },

    {
        id: 'gym-teacher',
        name: 'Gym Teacher',
        cost: 1,
        type: 'Attack',
        art: '🏀',
        image: 'graphics/cards/gym-teacher.jpg',
        imageAlt: 'The gym teacher',
        imageScale: 1.1,
        description: 'Deal 10 damage. Gain 6 Relaxation.',
        demo: true,
        hero: true,
        startingSanity: 40,
        startingEnergy: 3,
        startingDeck: [
            'team-spirit',
            'running-shoes',
            'stacked-mats',
            'sports-drink',
            'basketball-pass',
            'basketball-pass',
            'basketball-pass',
            'sports-drink',
            'sports-drink',
            'stacked-mats'

        ],
        badgeText: 'Staff · Gym Teacher',
        badgeColor: '#c9652b',
        effects: [
            { type: 'damage', amount: 10 },
            { type: 'block', amount: 6 }
        ]
    },

    {
        id: 'lunch-lady',
        name: 'Lunch Lady',
        cost: 1,
        type: 'Skill',
        art: '🍎',
        image: 'graphics/cards/lunch-lady.png',
        imageAlt: 'The lunch lady',
        imageScale: 1.1,
        description: 'Heal 10 Sanity. Draw 1 card.',
        demo: true,
        hero: true,
        startingSanity: 30,
        startingEnergy: 4,
        startingDeck: [
            'fresh-fruits',
            'fresh-fruits',
            'chocolate-milk',
            'chocolate-milk',
            'protective-apron',
            'serving-spoon',
            'serving-spoon',
            'serving-spoon',
            'clean-tray',
            'clean-tray'
        ],
        badgeText: 'Staff · Lunch Lady',
        badgeColor: '#b8860b',
        effects: [
            { type: 'heal', amount: 10 },
            { type: 'draw', amount: 1 }
        ]
    },

    {
        id: 'librarian',
        name: 'Librarian',
        cost: 2,
        type: 'Skill',
        art: '📚',
        image: 'graphics/cards/librarian.png',
        imageAlt: 'The school librarian',
        imageScale: 1.3,
        description: 'Gain 12 Relaxation. Draw 2 cards.',
        demo: true,
        hero: true,
        startingSanity: 35,
        startingEnergy: 4,
        startingDeck: [
            'hardcover-slam',
            'quiet-corner',
            'herbal-tea',
            'research-notes',
            'library-rules',
            'hardcover-slam',
            'quiet-corner',
            'herbal-tea',
            'research-notes',
            'hardcover-slam',
        ],
        badgeText: 'Staff · Librarian',
        badgeColor: '#3f7d55',
        effects: [
            { type: 'block', amount: 12 },
            { type: 'draw', amount: 2 }
        ]
    },

    {
        id: 'principal',
        name: 'Principal',
        cost: 3,
        type: 'Power',
        art: '📋',
        image: 'graphics/cards/principal.png',
        imageAlt: 'The school principal',
        imageScale: 1.1,
        description: 'Whenever you play an Attack card, apply 1 Called Out. Confiscated.',
        demo: true,
        hero: true,
        startingSanity: 50,
        startingEnergy: 3,
        startingDeck: [
            'red-pen-markup',
            'backpack-wall',
            'morning-coffee',
            'teachers-pet',
            'red-pen-markup',
            'desk-key',
            'coffee-refill',
            'red-pen-markup',
            'backpack-wall',
            'morning-coffee'
        ],
        badgeText: 'Staff · Principal',
        badgeColor: '#7b4aa3',
        effects: [
            {
                type: 'power',
                trigger: 'playAttack',
                effect: {
                    type: 'status',
                    status: 'calledOut',
                    amount: 1
                }
            },
            { type: 'confiscate' }
        ]
    },

    // ---------- LIBRARY: player bonus cards ----------
    {
        id: 'hardcover-slam',
        name: 'Hardcover Slam',
        cost: 2,
        type: 'Attack',
        rarity: 'Common',
        art: '📕',
        description: 'Deal 9 damage.',
        effects: [
            { type: 'damage', amount: 9 }
        ]
    },
    {
        id: 'quiet-corner',
        name: 'Quiet Corner',
        cost: 1,
        type: 'Defense',
        rarity: 'Common',
        art: '🪑',
        description: 'Gain 8 Relaxation.',
        effects: [
            { type: 'block', amount: 8 }
        ]
    },
    {
        id: 'herbal-tea',
        name: 'Herbal Tea',
        cost: 1,
        type: 'Skill',
        rarity: 'Common',
        art: '🍵',
        description: 'Recover 6 Sanity.',
        effects: [
            { type: 'heal', amount: 6 }
        ]
    },
    {
        id: 'research-notes',
        name: 'Research Notes',
        cost: 1,
        type: 'Skill',
        rarity: 'Common',
        art: '📝',
        description: 'Draw 1 card. Gain 4 Relaxation.',
        effects: [
            { type: 'draw', amount: 1 },
            { type: 'block', amount: 4 }
        ]
    },
    {
        id: 'library-rules',
        name: 'Library Rules',
        cost: 2,
        type: 'Power',
        rarity: 'Uncommon',
        art: '🤫',
        description: 'Whenever you play an Attack card, Call Out the enemy.',
        effects: [
            { type: 'power', trigger: 'playAttack', effect: { type: 'status', status: 'calledOut', amount: 1 } }
        ]
    }
];
/* Look up a card by id, e.g. SC.getCard('pencil-of-destiny') */
SC.getCard = function (id) {
    return SC.cards.find(function (card) {
        return card.id === id;
    });
};
