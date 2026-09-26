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
        // Title screen showcase only. demo: true keeps it off the Cards board.
        id: 'substitute-teacher',
        name: 'Substitute Teacher',
        cost: 1,
        type: 'Attack',
        art: '🧑‍🏫',
        description: 'Deal 1000 damage.',
        demo: true,
        effects: [
            { type: 'damage', amount: 1000 }
        ]
    }
];
/* Look up a card by id, e.g. SC.getCard('pencil-of-destiny') */
SC.getCard = function (id) {
    return SC.cards.find(function (card) {
        return card.id === id;
    });
};