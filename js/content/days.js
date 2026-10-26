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
 *   zones  - (optional) mini-zones inside this location. Clicking the
 *            location opens its zone map instead of a fight. The last
 *            zone is the boss. See js/ui/zones.js for the zone fields.
 *   zoneMap - the picture for the zone map (when the node has zones)
 *   sound  - (optional) a sound from audio.js to play when it's clicked
 */

window.SC = window.SC || {};

SC.days = {
    list: [
        {
            id: 'day-1',   // saved in localStorage so Continue knows which day you're on
            title: 'Day 1: The Substitute Shift',
            subtitle: 'Survive the day, one class at a time.',
            nodes: [
                { id: 'homeroom-boss',  label: 'Homeroom',      icon: '📝', type: 'combat', pos: { x: 15.4, y: 28.3 }, 
                    zoneMap: 'graphics/screens/homeroom-map.jpg',
                    sound: 'bell',
                    zones: [
                        { id: 'homeroom-markers', label: 'Did those markers MOVE', mark: 'X', type: 'combat', pos: {x:20, y: 45}},
                        { id: 'homeroom-computer', label: 'A virus is spreading', mark: 'X', type: 'combat', pos: {x:58, y: 40}},
                        { id: 'homeroom-boss', label: 'Disruption in class', mark: 'X', type: 'boss', pos: {x: 87, y: 50}}
                    ]
                },
                { id: 'hallway',   label: 'Hallway Patrol',     icon: '🚪', type: 'combat', pos: { x: 38.9, y: 28.3 } },
                { id: 'cafeteria', label: 'Cafeteria Duty',     icon: '🍎', type: 'combat',   pos: { x: 62.6, y: 28.5 } },
                { id: 'gym',       label: 'Gym Class',          icon: '🏀', type: 'combat', pos: { x: 39.1, y: 67.9 },
                  // The coach's clipboard: left basket -> center court -> right basket (boss)
                  zoneMap: 'graphics/screens/gym-map.png',
                  sound: 'whistle',             // plays when you click Gym Class (audio.js)
                  zones: [
                      { id: 'gym-warmup',    label: 'Jump Rope Warm-Up',    mark: 'O', type: 'combat', pos: { x: 22, y: 50 } },
                      { id: 'gym-dodgeball', label: 'Dodgeball Drill', mark: 'X', type: 'combat', pos: { x: 50, y: 50 } },
                      { id: 'gym',           label: 'The PACER Test',  mark: 'X', type: 'boss',   pos: { x: 79, y: 50 } }
                  ]
                },
                { id: 'library',   label: 'Library',            icon: '📚', type: 'combat',  pos: { x: 63.6, y: 67.5 } },
                { id: 'principal', label: "Principal's Office", icon: '🏆', type: 'combat',   pos: { x: 85.0, y: 66.6 } }
            ]
        }
    ]
};

// The day the player is currently on. Only Day 1 exists for now.
// To support more days later, change this to pick based on progress.
SC.days.current = SC.days.list[0];