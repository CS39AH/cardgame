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
        id: 'substitute-teacher',
        name: 'Substitute Teacher',
        cost: 1,
        type: 'Attack',
        art: '🧑‍🏫',
        description: 'Deal 1000 damage.',
        effects: [
            { type: 'damage', amount: 1000 }
        ]
    }
];

/* Look up a card by id, e.g. SC.getCard('substitute-teacher') */
SC.getCard = function (id) {
    return SC.cards.find(function (card) {
        return card.id === id;
    });
};