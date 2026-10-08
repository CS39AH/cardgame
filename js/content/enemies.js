/* =========================================================
   SUBSTITUTE CHAOS — ENEMIES
   =========================================================
   Each enemy has Sanity and a deck of Enemy cards from
   js/content/cards.js (rarity: 'Enemy'). Every turn it plays
   cardsPerTurn cards from its deck.

   order: 'inOrder' plays the deck top to bottom, then repeats
          (predictable, good for the tutorial)
          'random' picks a random card from the deck each time

   Enemies ignore card costs for now.
   ========================================================= */

window.SC = window.SC || {};

SC.enemies = {
    'class-clown': {
        id: 'class-clown',
        name: 'Class Clown',
        art: '🤡',
        sanity: 20,
        cardsPerTurn: 1,
        order: 'inOrder',
        deck: ['stapler-shot', 'stapler-shot', 'eraser']
    }
};