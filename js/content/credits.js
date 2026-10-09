/* =========================================================
   SUBSTITUTE CHAOS — CREDITS DATA
   =========================================================
   Everything shown on the Credits screen. Edit names, roles,
   and asset credits here; the screen builds itself from this.
   ========================================================= */

window.SC = window.SC || {};

SC.credits = {

    // One row per team member on the attendance roster
    team: [
        { name: 'Erik Porter',  role: 'Title screen, card system, screen router, Cards screen' },
        { name: 'Aaron Villalobos',   role: 'What they worked on' },
        { name: 'Jonathan Chavez',   role: 'What they worked on' },
        { name: 'Landry Vewenda',   role: 'What they worked on' },
        { name: 'Malachi Mooty',   role: 'Card developement and written tutorial' }
    ],

    // Sections listed under the roster
    sections: [
        {
            title: 'Guest Speakers',
            subtitle: 'Art and photos',
            items: [
                { label: 'Classroom background', detail: 'Photo by victorsteep (Pixabay)' },
                { label: 'Chalkboard',           detail: 'By geralt (Pixabay)' },
                { label: 'Card art',             detail: 'AI-generated' }
            ]
        },
        {
            title: 'School Supplies',
            subtitle: 'Fonts and sounds',
            items: [
                { label: 'Fonts',         detail: 'Kalam and Special Elite (Google Fonts)' },
                { label: 'Sound effects', detail: 'Generated in the browser with the Web Audio API' },
                { label: 'Main menu music', detail: 'Song name by Artist (Pixabay)' }            ]
        },
        {
            title: 'Study Buddies',
            subtitle: 'AI teammates',
            items: [
                { label: 'Claude (Anthropic)', detail: 'Add how it helped as a teamate rather than a tool' }
            ]
        },
        {
            title: 'Required Reading',
            subtitle: 'Inspiration',
            items: [
                { label: 'Deck Builder Games', detail: 'Any Deck builder game that everyone knows and loves.' }
            ]
        }
    ]
};