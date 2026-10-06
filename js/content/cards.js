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
        id: 'teachers-pet',
        name: "Teacher's Pet",
        cost: 1,
        type: 'Attack',
        rarity: 'Uncommon',
        art: '🐹',                                    // fallback if the image is missing
        image: 'graphics/cards/teacherspet.png',
        imageAlt: 'The class hamster',
        imageScale: 1.8,
        description: 'Whenever you play an Attack card, Teacher\'s Pet deals 1 damage.',
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
        description: 'Whenever you are hit by an Attack, Mitigate 2 damage',
        effects: [
            { type: 'power', trigger: 'Attacked', effect: { type: 'damage', amount: -2 } }
        ]
    },
        {
        id: 'lesson-plan',
        name: 'Lesson Plan',
        cost: 1,
        type: 'Common',
        rarity: 'Skill',
        art: '📁',                                   // fallback if the image is missing
        image: 'graphics/cards/lesson_plan.png',
        imageAlt: 'A folder with the lesson plan left by the teacher',
        imageScale: 1.0,
        description: 'Take your discard pill and shuffle it into your deck.',
        effects: [
            {type: 'shuffle', amount: 'deck'}
        ]
    },


    {
        // Title screen showcase only. demo: true keeps it off the Cards board.
        id: 'substitute-teacher',
        name: 'Substitute Teacher',
        cost: 1,
        type: 'Attack',
        art: '🧑‍🏫',                                  // fallback if the image is missing
        image: 'graphics/cards/teacher.png',
        imageAlt: 'The substitute teacher',
        imageScale: 1.1,
        description: 'Deal 1000 damage.',
        demo: true,
        hero: true,
        badgeText: 'Staff · Substitute',
        badgeColor: '#b92626',
        effects: [
            { type: 'damage', amount: 1000 }
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
        image: 'graphics/cards/gym-teacher.png',
        imageAlt: 'The gym teacher',
        imageScale: 1.1,
        description: 'Deal 10 damage. Gain 6 Relaxation.',
        demo: true,
        hero: true,
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
    }
];
/* Look up a card by id, e.g. SC.getCard('pencil-of-destiny') */
SC.getCard = function (id) {
    return SC.cards.find(function (card) {
        return card.id === id;
    });
};
