/* =========================================================
   SUBSTITUTE CHAOS — MAIN ENTRY POINT + SCREEN ROUTER
   =========================================================
   Hash-based router with animated transitions. The title
   screen lives in index.html; every other screen is loaded
   from screens/<name>.html.

     #          → title screen
     #cards     → screens/cards.html (zooms into the chalkboards)

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

    const SCREENS = ['cards', 'credits'];

    // Screen-specific setup that runs after a screen is swapped in
    const SCREEN_SETUP = {
        cards: setupCards,
        credits: setupCredits
    };

    // Exit animation lengths in ms (match the CSS)
    const TIMING = {
        titleFadeOut: 200,
        boardLeave: 450
    };

    // Credits check marks (ms). Change these to speed up or slow down
    // the checks; the pen sounds follow automatically.
    const CHECK_TIMING = {
        first: 700,    // wait before the first check
        gap: 550,      // time between each check
        land: 250      // how far into its animation a check "hits" the paper
    };

    const SCREEN = document.getElementById('screen');

    // Save the title screen before anything touches it,
    // so we can put it back when the player returns.
    const TITLE_HTML = SCREEN.innerHTML;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let currentScreen = null;
    let routeId = 0;

    // Pending card-slam sounds, so they can be cancelled
    let dealTimers = [];

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
            // Room zooms back out while the boards shrink into it
            closeCardZoom();
            clearDealTimers();
            document.body.classList.remove('scene--board');
            document.body.style.removeProperty('--pan');

            if (SC.playSound) {
                SC.playSound('whoosh');
            }

            const section = SCREEN.querySelector('.cards-screen');
            if (section) {
                section.classList.add('cards-screen--leaving');
            }
            return wait(TIMING.boardLeave);
        }

        if (from === 'credits') {
            clearDealTimers();

            // Clipboard gets set down as the sheet fades out
            if (SC.playSound) {
                SC.playSound('clipboardDown');
            }

            SCREEN.classList.add('is-fading');
            return wait(TIMING.titleFadeOut);
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

        // Paper shuffle and clip snap as the attendance sheet comes up
        if (name === 'credits' && SC.playSound) {
            SC.playSound('clipboard');
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
       // Staff selector
        const demoSlot = document.getElementById('demo-card');
        const btnTeacherPrev = document.getElementById('teacher-prev');
        const btnTeacherNext = document.getElementById('teacher-next');

        const teacherIds = [
            'substitute-teacher',
            'janitor',
            'gym-teacher',
            'lunch-lady',
            'librarian',
            'principal'
        ];

        let selectedTeacherIndex = 0;

        function renderSelectedTeacher() {
            const teacher = SC.getCard
                ? SC.getCard(teacherIds[selectedTeacherIndex])
                : null;

            if (!demoSlot || !teacher || !SC.renderCard) {
                return;
            }

            demoSlot.innerHTML = '';
            demoSlot.appendChild(SC.renderCard(teacher));
            demoSlot.classList.add('card-slot--filled');

            // Save the currently selected teacher on the element.
            demoSlot.dataset.selectedTeacher = teacher.id;
        }

        renderSelectedTeacher();

        btnTeacherPrev.addEventListener('click', function () {
            selectedTeacherIndex =
                (selectedTeacherIndex - 1 + teacherIds.length) % teacherIds.length;

            renderSelectedTeacher();
        });

        btnTeacherNext.addEventListener('click', function () {
            selectedTeacherIndex =
                (selectedTeacherIndex + 1) % teacherIds.length;

            renderSelectedTeacher();
        });

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
            SC.playSound('bell');
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
            window.location.hash = 'credits';
        });

        // Menu sounds: chalk tap on hover, chalk click on press.
        // Start a New Day rings the bell instead of clicking.
        const menuButtons = document.querySelectorAll('.title-screen__menu .btn');

        menuButtons.forEach(function (button) {
            button.addEventListener('pointerenter', function (e) {
                if (e.pointerType === 'mouse') {
                    SC.playSound('chalkTap', true);
                }
            });

            if (button !== btnStart) {
                button.addEventListener('click', function () {
                    SC.playSound('chalkClick');
                });
            }
        });

        // Background music (starts on the player's first click or tap)
        SC.startMusic();
    }

    // ------- CARDS SCREEN -------

    function setupCards() {
        const viewport = SCREEN.querySelector('.board-viewport');
        const track = SCREEN.querySelector('.board-track');
        const tabs = SCREEN.querySelectorAll('.board-tab');

        if (!viewport || !track) {
            return;
        }

        // Every playable card (demo cards stay on the title screen only)
        const boardCards = SC.cards.filter(function (card) {
            return !card.demo;
        });

        function rarityOf(card) {
            return (card.rarity || 'Common').toLowerCase();
        }

        // Build one chalkboard per tab, in tab order (left to right)
        const boards = [];

        tabs.forEach(function (tab, index) {
            const rarity = tab.dataset.rarity;
            const label = tab.textContent;
            const list = boardCards.filter(function (card) {
                return rarityOf(card) === rarity;
            });

            tab.textContent = label + ' (' + list.length + ')';
            tab.addEventListener('click', function () {
                showBoard(index, true);
            });

            const board = buildBoard(rarity, label, list);
            boards.push(board);
            track.appendChild(board);
        });

        // Slide the wall so the chosen board is in view.
        // When animate is true, the cards slam onto the new board.
        function showBoard(index, animate) {
            track.style.setProperty('--board-index', index);

            // Shift the room behind a little, like walking along the wall
            document.body.style.setProperty('--pan', index);

            tabs.forEach(function (tab, i) {
                const active = i === index;
                tab.classList.toggle('board-tab--active', active);
                tab.setAttribute('aria-selected', active);
            });

            // Off-screen boards can't be clicked or tabbed into
            boards.forEach(function (board, i) {
                board.inert = i !== index;
                board.classList.remove('is-dealing');
            });

            clearDealTimers();

            if (!animate) {
                return;
            }

            // Restart the slam animation on the new board
            const board = boards[index];
            void board.offsetWidth;
            board.classList.add('is-dealing');

            // A thud for each card as it lands (matches the CSS timing)
            const landed = board.querySelectorAll('.card-slot--filled');
            landed.forEach(function (slot, i) {
                const landAt = 450 + i * 120 + 270;
                dealTimers.push(setTimeout(function () {
                    if (SC.playSound) {
                        SC.playSound('slam');
                    }
                }, landAt));
            });
        }

        showBoard(0, false);

        // Make the boards grow out of the photo's chalkboard.
        // Work out how far the photo's chalkboard is from the viewport's
        // center, and hand that to the CSS animation as its start point.
        const rect = viewport.getBoundingClientRect();
        const rootStyles = getComputedStyle(document.documentElement);
        const boardX = (parseFloat(rootStyles.getPropertyValue('--board-x')) || 50) / 100;
        const boardY = (parseFloat(rootStyles.getPropertyValue('--board-y')) || 50) / 100;

        const targetX = window.innerWidth * boardX;
        const targetY = window.innerHeight * boardY;
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        viewport.style.setProperty('--from-x', (targetX - centerX) + 'px');
        viewport.style.setProperty('--from-y', (targetY - centerY) + 'px');
    }

    // One chalkboard: rarity name, card count, and the pinned card slots
    function buildBoard(rarity, label, list) {
        const board = document.createElement('div');
        board.className = 'chalkboard';
        board.dataset.rarity = rarity;
        board.setAttribute('role', 'tabpanel');
        board.setAttribute('aria-label', label + ' cards');

        const title = document.createElement('h2');
        title.className = 'chalkboard__title';
        title.textContent = label;

        const subtitle = document.createElement('p');
        subtitle.className = 'chalkboard__subtitle';
        subtitle.textContent = list.length === 0
            ? 'No cards yet.'
            : list.length + (list.length === 1 ? ' card' : ' cards');

        const grid = document.createElement('div');
        grid.className = 'chalkboard__cards';

        // Always at least 5 slots; more rows if a tier has more cards
        const slotCount = Math.max(5, list.length);
        for (let i = 0; i < slotCount; i++) {
            const slot = document.createElement('div');
            slot.className = 'card-slot board-slot';

            if (list[i]) {
                slot.appendChild(makeBoardCard(list[i]));
                slot.classList.add('card-slot--filled');

                // Order the card lands in when the board is dealt
                slot.style.setProperty('--deal-order', i);
            }

            grid.appendChild(slot);
        }

        board.appendChild(title);
        board.appendChild(subtitle);
        board.appendChild(grid);

        return board;
    }

    // A card pinned on the board that can be picked up for a closer look
    function makeBoardCard(card) {
        const el = SC.renderCard(card);

        // Click (or Enter/Space) picks the card up
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

        return el;
    }

    function clearDealTimers() {
        dealTimers.forEach(clearTimeout);
        dealTimers = [];
    }
    // ------- CREDITS SCREEN -------

    function setupCredits() {
        const roster = SCREEN.querySelector('.attendance__roster');
        const sectionsBox = SCREEN.querySelector('.attendance__sections');

        if (!roster || !sectionsBox || !SC.credits) {
            return;
        }

        // Roster: one row per teammate, with a red check that pops in
        SC.credits.team.forEach(function (member, i) {
            const row = document.createElement('tr');

            row.appendChild(makeCell(String(i + 1), 'attendance__num'));
            row.appendChild(makeCell(member.name, 'attendance__name'));
            row.appendChild(makeCell(member.role, 'attendance__role'));

            const present = makeCell('', 'attendance__present');
            const check = document.createElement('span');
            check.className = 'attendance__check';
            check.textContent = '✓';
            check.setAttribute('aria-label', 'Present');

            // Each check waits its turn, then a pen scratch as it lands
            const delay = CHECK_TIMING.first + i * CHECK_TIMING.gap;
            check.style.animationDelay = delay + 'ms';

            dealTimers.push(setTimeout(function () {
                if (SC.playSound) {
                    SC.playSound('penCheck');
                }
            }, delay + CHECK_TIMING.land));

            present.appendChild(check);
            row.appendChild(present);

            roster.appendChild(row);
        });

        // Credit sections under the roster
        SC.credits.sections.forEach(function (section) {
            const box = document.createElement('div');
            box.className = 'attendance__section';

            const title = document.createElement('h2');
            title.className = 'attendance__section-title';
            title.textContent = section.title;

            const subtitle = document.createElement('p');
            subtitle.className = 'attendance__section-subtitle';
            subtitle.textContent = section.subtitle;

            const list = document.createElement('ul');
            list.className = 'attendance__list';

            section.items.forEach(function (item) {
                const li = document.createElement('li');
                const label = document.createElement('strong');
                label.textContent = item.label + ': ';
                li.appendChild(label);
                li.appendChild(document.createTextNode(item.detail));
                list.appendChild(li);
            });

            box.appendChild(title);
            box.appendChild(subtitle);
            box.appendChild(list);
            sectionsBox.appendChild(box);
        });
    }

    function makeCell(text, className) {
        const cell = document.createElement('td');
        cell.className = className;
        cell.textContent = text;
        return cell;
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