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
        enemy: 'class-clown'
    }
};