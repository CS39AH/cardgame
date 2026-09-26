/* =========================================================
   SUBSTITUTE CHAOS — MAIN ENTRY POINT + SCREEN ROUTER
   =========================================================
   Hash-based router with animated transitions. The title
   screen lives in index.html; every other screen is loaded
   from screens/<name>.html.

     #          → title screen
     #cards     → screens/cards.html (zooms into the chalkboard)

   Each screen change runs in two phases:
     1. leave()  — play the current screen's exit animation
     2. enter()  — swap in the new screen and set it up

   To add a screen:
     1. Create screens/<name>.html
     2. Add <name> to SCREENS below
     3. (Optional) add a setup function to SCREEN_SETUP
   ========================================================= */

(function () {
    'use strict';

    // ------- CONFIG -------

    const SCREENS = ['cards'];

    // Screen-specific setup that runs after a screen is swapped in
    const SCREEN_SETUP = {
        cards: setupCards
    };

    // Exit animation lengths in ms (match the CSS)
    const TIMING = {
        titleFadeOut: 200,
        boardLeave: 450
    };

    const SCREEN = document.getElementById('screen');

    // Save the title screen before anything touches it,
    // so we can put it back when the player returns.
    const TITLE_HTML = SCREEN.innerHTML;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let currentScreen = null;
    let routeId = 0;

    // ------- ROUTER -------

    function screenFromHash() {
        const name = window.location.hash.slice(1).toLowerCase().trim();
        return SCREENS.includes(name) ? name : 'title';
    }

    function route() {
        const target = screenFromHash();

        if (target === currentScreen) {
            return;
        }

        const from = currentScreen;
        currentScreen = target;
        const id = ++routeId;

        // Start loading the next screen while the exit animation plays
        const htmlPromise = target === 'title'
            ? Promise.resolve(TITLE_HTML)
            : fetchScreen(target);
        htmlPromise.catch(function () {}); // handled below; avoids console noise

        leave(from)
            .then(function () { return htmlPromise; })
            .then(function (html) {
                // If the player clicked somewhere else in the meantime, drop this
                if (id !== routeId) {
                    return;
                }
                enter(target, html);
            })
            .catch(function (err) {
                if (id !== routeId) {
                    return;
                }
                showError(target, err);
            });
    }

    function fetchScreen(name) {
        return fetch('screens/' + name + '.html').then(function (response) {
            if (!response.ok) {
                throw new Error('Screen returned status ' + response.status);
            }
            return response.text();
        });
    }

    // ------- PHASE 1: LEAVE -------

    function leave(from) {
        if (from === 'title') {
            // Title content fades out
            SC.stopOrbit();
            SCREEN.classList.add('is-fading');
            return wait(TIMING.titleFadeOut);
        }

                if (from === 'cards') {
            // Room zooms back out while the board shrinks into it
            closeCardZoom();
            if (SC.playSound) {
                SC.playSound('whoosh');
            }
            document.body.classList.remove('scene--board');
            const section = SCREEN.querySelector('.cards-screen');
            if (section) {
                section.classList.add('cards-screen--leaving');
            }
            return wait(TIMING.boardLeave);
        }

        return Promise.resolve(); // first page load, nothing to leave
    }

    // ------- PHASE 2: ENTER -------

    function enter(name, html) {
        SCREEN.innerHTML = html;
        SCREEN.dataset.screen = name;
        document.title = name === 'title'
            ? 'Substitute Chaos'
            : capitalize(name) + ' — Substitute Chaos';

        // Zoom the room toward the chalkboard (only for Cards)
        document.body.classList.toggle('scene--board', name === 'cards');

        // Eraser sound as the camera moves to the chalkboard
        if (name === 'cards' && SC.playSound) {
            SC.playSound('eraser');
        }

        window.scrollTo(0, 0);

        if (name === 'title') {
            setupTitle();
        } else if (SCREEN_SETUP[name]) {
            SCREEN_SETUP[name]();
        }

        SCREEN.classList.remove('is-fading');
    }

    function showError(name, err) {
        console.error('Failed to load screen "' + name + '":', err);
        document.body.classList.remove('scene--board');
        SCREEN.innerHTML =
            '<section class="cards-screen">' +
            '<h1>That screen isn\'t ready yet</h1>' +
            '<p><a href="#" class="cards-screen__back">← Back to Title</a></p>' +
            '</section>';
        SCREEN.classList.remove('is-fading');
    }

    // ------- TITLE SCREEN -------

    function setupTitle() {
        // Demo card
        const demoSlot = document.getElementById('demo-card');
        const demoCard = SC.getCard ? (SC.getCard('substitute-teacher') || SC.cards[0]) : null;

        if (demoSlot && demoCard && SC.renderCard) {
            demoSlot.appendChild(SC.renderCard(demoCard));
            demoSlot.classList.add('card-slot--filled');
        }

        // Orbiting supplies
        SC.startOrbit();

        // Buttons
        const btnStart = document.getElementById('btn-start');
        const btnContinue = document.getElementById('btn-continue');
        const btnHow = document.getElementById('btn-how');
        const btnCredits = document.getElementById('btn-credits');

        if (localStorage.getItem('sc-save')) {
            btnContinue.hidden = false;
        }

        btnStart.addEventListener('click', function () {
            console.log('New game — combat screen will load here.');
            // TODO: startNewGame();
        });

        btnContinue.addEventListener('click', function () {
            console.log('Continue — load save from localStorage.');
            // TODO: loadSavedGame();
        });

        btnHow.addEventListener('click', function () {
            console.log('How to play — will become #how.');
        });

        btnCredits.addEventListener('click', function () {
            console.log('Credits — will become #credits.');
        });
    }

    // ------- CARDS SCREEN -------

    function setupCards() {
        const board = SCREEN.querySelector('.chalkboard');
        if (!board) {
            return;
        }

        // Pin real cards into the slots, in the order they appear in cards.js.
        // Cards marked demo: true (title screen only) are skipped.
        const slots = SCREEN.querySelectorAll('.board-slot');
        const boardCards = SC.cards.filter(function (card) {
            return !card.demo;
        });

        boardCards.slice(0, slots.length).forEach(function (card, i) {
            const el = SC.renderCard(card);

            // Click (or Enter/Space) picks the card up for a closer look
            el.tabIndex = 0;
            el.addEventListener('click', function () {
                openCardZoom(card);
            });
            el.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openCardZoom(card);
                }
            });

            slots[i].appendChild(el);
            slots[i].classList.add('card-slot--filled');
        });

        // Make the board grow out of the photo's chalkboard.
        // Work out how far the photo's chalkboard is from the board's
        // center, and hand that to the CSS animation as its start point.
        const rect = board.getBoundingClientRect();
        const rootStyles = getComputedStyle(document.documentElement);
        const boardX = (parseFloat(rootStyles.getPropertyValue('--board-x')) || 50) / 100;
        const boardY = (parseFloat(rootStyles.getPropertyValue('--board-y')) || 50) / 100;

        const targetX = window.innerWidth * boardX;
        const targetY = window.innerHeight * boardY;
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        board.style.setProperty('--from-x', (targetX - centerX) + 'px');
        board.style.setProperty('--from-y', (targetY - centerY) + 'px');
    }

    // ------- CARD PICK-UP VIEW -------

    function openCardZoom(card) {
        closeCardZoom();

        const overlay = document.createElement('div');
        overlay.className = 'card-zoom';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-label', card.name);

        const frame = document.createElement('div');
        frame.className = 'card-zoom__frame';
        frame.appendChild(SC.renderCard(card));

        const hint = document.createElement('p');
        hint.className = 'card-zoom__hint';
        hint.textContent = 'Click anywhere to put it back';

        overlay.appendChild(frame);
        overlay.appendChild(hint);

        // Click anywhere or press Escape to close
        overlay.addEventListener('click', closeCardZoom);
        document.addEventListener('keydown', onZoomKey);

        SCREEN.appendChild(overlay);
    }

    function closeCardZoom() {
        const overlay = document.querySelector('.card-zoom');
        if (overlay) {
            overlay.remove();
        }
        document.removeEventListener('keydown', onZoomKey);
    }

    function onZoomKey(e) {
        if (e.key === 'Escape') {
            closeCardZoom();
        }
    }

    // ------- HELPERS -------

    function wait(ms) {
        return new Promise(function (resolve) {
            setTimeout(resolve, reduceMotion ? 0 : ms);
        });
    }

    function capitalize(word) {
        return word.charAt(0).toUpperCase() + word.slice(1);
    }

    // ------- START -------

    window.addEventListener('hashchange', route);
    route();

})();