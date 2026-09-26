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
        art: '✏️',                                        // fallback if the image is missing
        image: 'graphics/cards/pencilofdestiny.png',
        imageAlt: 'An ornate golden pencil with a glowing blue gem',
        imageRotate: 75,     // degrees, turns the diagonal pencil upright
        imageScale: 1.5,     // 1 = normal size
        description: 'Deal 10 damage. Draw 1 card.',
        effects: [
            { type: 'damage', amount: 10 },
            { type: 'draw', amount: 1 }
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