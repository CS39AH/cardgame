/*
 * TEACHER PROFILE SCREEN
 * ----------------------
 * The staff file you see after picking a teacher on the title screen.
 * Shows who you're playing as: their ID badge, stats, bio, Teacher
 * Ability and starting deck. "Clock In" starts the day.
 *
 * The teacher comes from SC.selectedTeacher (set by the title screen).
 * Their card in cards.js has the stats, ability and deck; the bio and
 * playstyle come from js/content/teachers.js.
 */

window.SC = window.SC || {};

(function () {
    'use strict';

    // Card types in the order they're listed in the deck mix bar
    const TYPES = ['Attack', 'Defense', 'Skill', 'Power'];

    SC.setupTeacher = function () {
        const root = document.querySelector('.teacher-screen');
        if (!root || !SC.teacherInfo) return;

        const order = Object.keys(SC.teacherInfo);
        let index = Math.max(0, order.indexOf(SC.selectedTeacher));
        let clockingIn = false;

        // The best stat any teacher has, so the bars compare them fairly
        const maxSanity = Math.max.apply(null, order.map(function (id) {
            const t = SC.getCard(id);
            return t ? t.startingSanity || 30 : 30;
        }));

        const $ = function (id) { return document.getElementById(id); };

        function render() {
            const id = order[index];
            const teacher = SC.getCard(id);
            const info = SC.teacherInfo[id];
            if (!teacher || !info) return;

            SC.selectedTeacher = id;

            // ----- ID badge -----
            $('staff-tab').textContent = 'Personnel File · ' + teacher.name;
            $('staff-badge').textContent = teacher.badgeText || 'Staff';
            $('staff-badge').style.background = teacher.badgeColor || '#b92626';
            $('staff-photo').src = teacher.image || '';
            $('staff-photo').alt = teacher.imageAlt || teacher.name;
            $('staff-name').textContent = teacher.name;
            $('staff-title').textContent = info.title || '';

            // ----- Stats -----
            const deck = teacher.startingDeck || [];
            const sanity = teacher.startingSanity || 30;
            const coffee = teacher.startingEnergy || 3;

            $('staff-stats').innerHTML =
                stat('Sanity', sanity,
                    '<span class="staff-bar"><span class="staff-bar__fill" style="width:' +
                    Math.round(sanity / maxSanity * 100) + '%"></span></span>') +
                stat('Coffee per turn', coffee,
                    '<span class="staff-cups">' + repeat('☕', coffee) + '</span>') +
                stat('Deck size', deck.length + ' cards', '') +
                stat('Difficulty', '',
                    '<span class="staff-stars" aria-label="' + info.difficulty + ' of 3">' +
                    repeat('★', info.difficulty) + '<span class="staff-stars__off">' +
                    repeat('★', 3 - info.difficulty) + '</span></span>');

            // ----- Home turf: their location's photo -----
            const node = SC.days && SC.days.current.nodes.find(function (n) {
                return n.id === info.home;
            });
            $('staff-home').innerHTML = node
                ? '<img src="' + info.homePhoto + '" alt=""><span>' + node.icon + ' ' + node.label + '</span>'
                : '';

            // ----- Bio and playstyle -----
            $('staff-bio').textContent = info.bio;
            $('staff-tags').innerHTML = (info.playstyle || []).map(function (tag) {
                return '<li>' + tag + '</li>';
            }).join('');

            // ----- Teacher Ability: what the ability button does in a fight -----
            $('staff-ability').innerHTML =
                '<span class="staff-ability__cost" aria-label="Costs ' + teacher.cost + ' Coffee">' + teacher.cost + '</span>' +
                '<div><p class="staff-ability__type staff-ability__type--' + teacher.type.toLowerCase() + '">' +
                teacher.type + '</p><p class="staff-ability__desc">' + teacher.description + '</p></div>';

            // ----- Starting deck: each different card once, with ×2 / ×3 -----
            const counts = {};
            const unique = [];
            deck.forEach(function (cardId) {
                if (!counts[cardId]) unique.push(cardId);
                counts[cardId] = (counts[cardId] || 0) + 1;
            });

            $('staff-deck-note').textContent = deck.length + ' cards · ' + unique.length + ' different';

            // Deck mix bar: how many Attacks, Defenses, Skills and Powers
            const byType = {};
            deck.forEach(function (cardId) {
                const card = SC.getCard(cardId);
                if (card) byType[card.type] = (byType[card.type] || 0) + 1;
            });
            $('staff-mix').innerHTML =
                '<div class="staff-mix__bar">' + TYPES.map(function (type) {
                    const n = byType[type] || 0;
                    return n ? '<span class="staff-mix__part staff-mix__part--' + type.toLowerCase() +
                        '" style="flex:' + n + '"></span>' : '';
                }).join('') + '</div>' +
                '<div class="staff-mix__legend">' + TYPES.map(function (type) {
                    const n = byType[type] || 0;
                    return n ? '<span class="staff-mix__key staff-mix__key--' + type.toLowerCase() +
                        '">' + n + ' ' + type + '</span>' : '';
                }).join('') + '</div>';

            const deckBox = $('staff-deck');
            deckBox.innerHTML = '';
            unique.forEach(function (cardId, i) {
                const card = SC.getCard(cardId);
                if (!card) return;

                const slot = document.createElement('div');
                slot.className = 'staff-deck__slot';
                slot.style.setProperty('--deal-order', i);

                const el = SC.renderCard(card);
                el.tabIndex = 0;
                el.addEventListener('click', function () { SC.openCardZoom(card); });
                el.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        SC.openCardZoom(card);
                    }
                });
                slot.appendChild(el);

                if (counts[cardId] > 1) {
                    const count = document.createElement('span');
                    count.className = 'staff-deck__count';
                    count.textContent = '×' + counts[cardId];
                    slot.appendChild(count);
                }
                deckBox.appendChild(slot);
            });

            $('btn-clock-in').textContent = 'Clock In as ' + teacher.name + ' ›';

            // Pages slide in fresh each time
            const pages = $('staff-pages');
            pages.classList.remove('is-flipping');
            void pages.offsetWidth;
            pages.classList.add('is-flipping');
        }

        function stat(label, value, extra) {
            return '<div class="staff-stat"><dt>' + label + '</dt><dd>' +
                (value !== '' ? '<strong>' + value + '</strong>' : '') + extra + '</dd></div>';
        }

        function repeat(text, n) {
            return new Array(Math.max(0, n) + 1).join(text);
        }

        function flip(step) {
            if (clockingIn) return;
            index = (index + step + order.length) % order.length;
            if (SC.playSound) SC.playSound('clipboard');
            render();
        }

        $('staff-prev').addEventListener('click', function () { flip(-1); });
        $('staff-next').addEventListener('click', function () { flip(1); });

        // Arrow keys flip too (not while a card is zoomed in)
        function onKey(e) {
            if (!document.body.contains(root)) {
                document.removeEventListener('keydown', onKey);
                return;
            }
            if (document.querySelector('.card-zoom')) return;
            if (e.key === 'ArrowLeft') flip(-1);
            if (e.key === 'ArrowRight') flip(1);
        }
        document.addEventListener('keydown', onKey);

        // Clock In: the ON DUTY stamp slams onto the file, the bell
        // rings, and the day starts with this teacher
        $('btn-clock-in').addEventListener('click', function () {
            if (clockingIn) return;
            clockingIn = true;

            localStorage.setItem('sc-save', JSON.stringify({
                dayId: SC.days.current.id,
                nodeIndex: 0,
                teacher: order[index]
            }));

            const reduce = SC.REDUCE_ANIMATIONS;
            $('staff-stamp').classList.add('is-stamped');
            if (SC.playSound) SC.playSound('slam');

            setTimeout(function () {
                if (SC.playSound) SC.playSound('bell');
                window.location.hash = 'map';
            }, reduce ? 150 : 900);
        });

        render();
        if (SC.playSound) SC.playSound('clipboard');
    };
})();