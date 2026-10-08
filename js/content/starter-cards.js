/* =========================================================
   SUBSTITUTE CHAOS — STARTER CARDS
   =========================================================
   Test cards for combat rules that no real card uses yet:
   putting a defender on the field, and gaining Coffee.
   Kept in their own file so they don't collide with other
   branches editing cards.js. Move into cards.js (or replace
   with real cards) once the team has designs for them.
   ========================================================= */

window.SC = window.SC || {};
SC.cards = SC.cards || [];

SC.cards.push(
    {
        id: 'backpack-wall',
        name: 'Backpack Wall',
        cost: 1,
        type: 'Defense',
        rarity: 'Common',
        art: '🎒',
        description: 'Put a Backpack on the field with 6 Sanity. It takes hits before you do.',
        effects: [
            { type: 'defender', name: 'Backpack', amount: 6 }
        ]
    },
    {
        id: 'coffee-refill',
        name: 'Coffee Refill',
        cost: 0,
        type: 'Skill',
        rarity: 'Common',
        art: '☕',
        description: 'Gain 1 Coffee.',
        effects: [
            { type: 'energy', amount: 1 }
        ]
    }
);