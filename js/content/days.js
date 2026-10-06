/*
 * DAY MAP DATA
 * ------------
 * Defines each "day" the player can play and the encounters (nodes) in it.
 * The map screen reads this file; it does not contain any game logic.
 *
 * To add or change a stop on the map, edit the `nodes` array below.
 * Nodes appear on the map in the same order as the array (first = start).
 *
 * Node fields:
 *   id     - unique name for the node, used in the save file and console logs
 *   label  - text shown under the node on the map
 *   icon   - emoji shown on the node button
 *   type   - what kind of encounter it is: 'combat', 'rest', 'event', or 'boss'
 *            (controls the node's color style, and later which screen it opens)
 */

window.SC = window.SC || {};

SC.days = {
    list: [
        {
            id: 'day-1',   // saved in localStorage so Continue knows which day you're on
            title: 'Day 1: The Substitute Shift',
            subtitle: 'Survive the day, one class at a time.',
            nodes: [
                { id: 'homeroom',  label: 'Homeroom',           icon: '📝', type: 'combat', pos: { x: 15.4, y: 28.3 } },
                { id: 'hallway',   label: 'Hallway Patrol',     icon: '🚪', type: 'combat', pos: { x: 38.9, y: 28.3 } },
                { id: 'cafeteria', label: 'Cafeteria Duty',     icon: '🍎', type: 'combat',   pos: { x: 62.6, y: 28.5 } },
                { id: 'gym',       label: 'Gym Class',          icon: '🏀', type: 'combat', pos: { x: 39.1, y: 67.9 } },
                { id: 'library',   label: 'Library',            icon: '📚', type: 'combat',  pos: { x: 63.6, y: 67.5 } },
                { id: 'principal', label: "Principal's Office", icon: '🏆', type: 'combat',   pos: { x: 85.0, y: 66.6 } }
            ]
        }
    ]
};

// The day the player is currently on. Only Day 1 exists for now.
// To support more days later, change this to pick based on progress.
SC.days.current = SC.days.list[0];