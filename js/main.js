/* =========================================================
   SUBSTITUTE CHAOS — MAIN ENTRY POINT
   =========================================================
   Bootstraps the title screen. Once Person A builds the
   engine and Person B builds combat, this file becomes the
   screen router that swaps screens/*.html fragments into
   #screen based on game state.
   ========================================================= */

(function () {
    'use strict';

    // ------- DEMO CARD -------

    const demoSlot = document.getElementById('demo-card');
    const demoCard = SC.getCard('substitute-teacher');

    if (demoSlot && demoCard) {
        demoSlot.appendChild(SC.renderCard(demoCard));
        demoSlot.classList.add('card-slot--filled');
    }

    // ------- TITLE SCREEN BUTTONS -------

    const btnStart = document.getElementById('btn-start');
    const btnContinue = document.getElementById('btn-continue');
    const btnHow = document.getElementById('btn-how');
    const btnCredits = document.getElementById('btn-credits');

    if (localStorage.getItem('sc-save')) {
        btnContinue.hidden = false;
    }

    btnStart.addEventListener('click', () => {
        console.log('New game — combat screen will load here.');
        // TODO: startNewGame();
    });

    btnContinue.addEventListener('click', () => {
        console.log('Continue — load save from localStorage.');
        // TODO: loadSavedGame();
    });

    btnHow.addEventListener('click', () => {
        console.log('How to play — will load screens/how.html.');
        // TODO: loadScreen('how');
    });

    btnCredits.addEventListener('click', () => {
        console.log('Credits — will load screens/credits.html.');
        // TODO: loadScreen('credits');
    });

})();