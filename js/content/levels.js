/* =========================================================
   SUBSTITUTE CHAOS — LEVELS
   =========================================================
   Settings for each fight.

   tutorial — opened by How to Play on the title screen.

   Map fights: a level whose id matches a node id on the day
   map (js/content/days.js) opens when that node is clicked,
   e.g. add a 'homeroom' level here for the Homeroom node.
   Nodes without a level still auto-complete.
   ========================================================= */

window.SC = window.SC || {};

SC.levels = {
    tutorial: {
        id: 'tutorial',
        name: 'How to Play: Tutorial',
        intro: 'Welcome, Sub! Play cards to win the fight.',
        winText: "You finished the tutorial. You're ready for your first real day!",

        sanity: 30,              // player's starting Sanity
        energy: 3,               // Coffee at the start of the fight
        refillEnergy: true,      // refill Coffee to 3 every turn? (decide tonight)
        handSize: 5,             // cards drawn each turn
        deckSize: 10,            // total cards in the starting deck

        // Always in the deck so the tutorial is winnable.
        // The rest of the deck is filled with random player cards.
        guaranteedCards: [
            'red-pen-markup',
            'red-pen-markup',
            'morning-coffee',
            'backpack-wall',
            'golden-apple'
        ],

        enemy: 'class-clown'     // from js/content/enemies.js
    }
};