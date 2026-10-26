window.SC = window.SC || {};

/* =========================================================
   LEVELS
   startingDeck: exact cards (tutorial). Leave it out and the
   deck is random: guaranteedCards + random fill to deckSize.
   shuffleDeck: false keeps startingDeck in the order written.
   ========================================================= */
SC.levels = {
    tutorial: {
        id: 'tutorial',
        name: 'How to Play: Tutorial',
        intro: 'Welcome, Sub! Play cards to win the fight.',
        winText: "You finished the tutorial. You're ready for your first real day!",
        sanity: 30,
        energy: 3,
        refillEnergy: true,
        handSize: 5,
        startingDeck: [
            // First hand
            'red-pen-markup',
            'backpack-wall',
            'morning-coffee',
            'teachers-pet',
            'red-pen-markup',
            // Second hand
            'desk-key',
            'coffee-refill',
            'red-pen-markup',
            'backpack-wall',
            'morning-coffee'
        ],
        shuffleDeck: false,
        enemy: 'class-clown-tutorial',
        hints: {
            1: 'Each card has a cost shown in the upper left hand corner.',
            2: 'You and your opponent have energy, ☕, that rests to the default amount at the start of your turn.',
            3: 'Keep your sanity above 0 to survive the day.',
            4: 'Utilize relaxation to protect your sanity.',
            5: 'Power cards are useful for buffing your cards and sometimes nerfing the enemies cards.'
        }
    },
    'homeroom-boss': {
        id: 'homeroom-boss',
        name: 'Disruption in class',
        intro: 'Of course you have to deal with a rowdy student.',
        winText: "They have been sent to detention. Class is over!",
        sanity: 30,
        energy: 3,
        refillEnergy: true,
        handSize: 5,
        enemy: 'class-clown'
    },


    cafeteria: {
        id: 'cafeteria',
        name: 'Cafeteria Duty',
        intro: 'The lunch rush is getting out of control!',
        winText: 'The cafeteria is finally under control!',
        sanity: 30,
        energy: 3,
        refillEnergy: true,
        handSize: 5,
        enemy: 'cafeteria-enemy',

        bonusCards: [
            'fresh-fruits',
            'chocolate-milk',
            'protective-apron',
            'serving-spoon',
            'clean-tray'
        ]
    },

    // ----- Gym zones (left basket, center court). The boss is `gym` below. -----
    'gym-warmup': {
        id: 'gym-warmup',
        name: 'Gym: Jump Rope Warm-Up',
        theme: 'gym',             // uses the gym's battle look
        intro: 'Grab a rope. Fifty jumps, no tripping!',
        winText: 'Fifty jumps done. On to the drills.',
        sanity: 30,
        energy: 3,
        refillEnergy: true,
        handSize: 5,
        enemy: 'gym-warmup-enemy',
        bonusCards: ['running-shoes', 'sports-drink']
    },

    'gym-dodgeball': {
        id: 'gym-dodgeball',
        name: 'Gym: Dodgeball Drill',
        theme: 'gym',
        intro: 'The ball cart is loaded and it is aimed right at you.',
        winText: 'The cart is empty. Only the PACER Test is left.',
        sanity: 30,
        energy: 3,
        refillEnergy: true,
        handSize: 5,
        enemy: 'gym-dodgeball-enemy',
        bonusCards: ['basketball-pass', 'stacked-mats']
    },

    gym: {
        id: 'gym',
        name: 'Gym Class',
        intro: 'Line up on the start line. The PACER Test begins... now!',
        winText: 'The beeping finally stops. You survived the PACER Test!',
        sanity: 30,
        energy: 3,
        refillEnergy: true,
        handSize: 5,
        enemy: 'gym-enemy',
        //hero: 'gym-teacher',      // this level always uses the Gym Teacher

        bonusCards: [
            'basketball-pass',
            'sports-drink',
            'stacked-mats',
            'running-shoes',
            'team-spirit'
        ]
    },

    library: {
    id: 'library',
    name: 'Library',
    intro: 'Shhh! Silence is golden. Someone is whispering too loudly, keep it down!',
    winText: 'Alas, silence has been restored. You may now read in peace.',
    sanity: 30,
    energy: 3,
    refillEnergy: true,
    handSize: 5,
    enemy: 'library-enemy',
    

    bonusCards: [
            'hardcover-slam',
            'quiet-corner',
            'herbal-tea',
            'research-notes',
            'library-rules'
        ]
    
    }

};