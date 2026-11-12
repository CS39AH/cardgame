/*
 * TEACHER PROFILES
 * ----------------
 * Extra info for the teacher profile screen (screens/teacher.html),
 * the "staff file" you see after picking a teacher on the title screen.
 *
 * The teacher's name, picture, stats, ability and starting deck all
 * come from their card in cards.js. This file only adds the flavor.
 *
 * Fields:
 *   title      - short nickname under their name
 *   bio        - a few sentences about them
 *   playstyle  - short tags for how they play
 *   difficulty - 1 (easy) to 3 (tricky)
 *   home       - their location's node id in days.js
 *   homePhoto  - small photo of that location (graphics/screens/thumbs/)
 *
 * The order here is the order you flip through them on the profile screen.
 */

window.SC = window.SC || {};

SC.teacherInfo = {
    'substitute-teacher': {
        title: 'The Fill-In',
        bio: 'Got the call at 6:12 AM. No lesson plan, no keys, and no idea ' +
             'which room. Survives on a red pen, a thermos of coffee and ' +
             'pure improvisation.',
        playstyle: ['Jack of all trades', 'Called Out', 'Backpack defenders'],
        difficulty: 2,
        home: 'homeroom-boss',
        homePhoto: 'graphics/screens/thumbs/homeroom.jpg'
    },
    'janitor': {
        title: 'Keeper of the Keys',
        bio: 'Knows every shortcut, every leak and every locker that sticks. ' +
             'Thirty years of cleaning up other people\'s messes means ' +
             'nothing in this building rattles him.',
        playstyle: ['Healing', 'Card draw', 'Steady'],
        difficulty: 1,
        home: 'hallway',
        homePhoto: 'graphics/screens/thumbs/hallway.jpg'
    },
    'lunch-lady': {
        title: 'Queen of the Cafeteria',
        bio: 'Feeds 600 kids in 25 minutes and still has time to judge your ' +
             'tray. Runs the kitchen like a battleship and never, ever ' +
             'runs out of chocolate milk.',
        playstyle: ['Extra Coffee', 'Healing', 'Life steal'],
        difficulty: 2,
        home: 'cafeteria',
        homePhoto: 'graphics/screens/thumbs/cafeteria.jpg'
    },
    'gym-teacher': {
        title: 'Coach',
        bio: 'Believes every problem can be solved with laps. Owns a whistle ' +
             'for every occasion and the lungs to back it up. Has not ' +
             'skipped leg day since 1998.',
        playstyle: ['Tanky', 'Defenders', 'Fast attacks'],
        difficulty: 1,
        home: 'gym',
        homePhoto: 'graphics/screens/thumbs/gym.jpg'
    },
    'librarian': {
        title: 'Keeper of the Quiet',
        bio: 'Has heard every excuse for an overdue book. Her "shh" has ' +
             'silenced entire assemblies, and she can find any book in the ' +
             'building with her eyes closed.',
        playstyle: ['Big hits', 'Relaxation', 'Extra Coffee'],
        difficulty: 2,
        home: 'library',
        homePhoto: 'graphics/screens/thumbs/library.jpg'
    },
    'principal': {
        title: 'The Boss',
        bio: 'Runs the whole building and keeps a file on everyone. Starts ' +
             'with the best tricks from every department, because rank has ' +
             'its privileges.',
        playstyle: ['Most Sanity', 'A bit of everything', 'Called Out'],
        difficulty: 3,
        home: 'principal',
        homePhoto: 'graphics/screens/thumbs/principal.jpg'
    }
};