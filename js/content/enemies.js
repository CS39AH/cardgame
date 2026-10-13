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
    'class-clown': {
        id: 'class-clown',
        name: 'Class Clown',
        art: '🤡',
        sanity: 20,
        energy: 3,
        order: 'inOrder',
        deck: [
            'stapler-shot',       // 1 Coffee: deal 2
            'eraser',             // 1 Coffee: gain 4 Relaxation
            'bin-dump',           // 1 Coffee: 1 damage per card in your discard pile
            'pencil-sharpener',   // 2 Coffee: Power, its attacks deal +1
            'scattered-pencils'   // 2 Coffee: deal 2, four times
        ]
    }
};