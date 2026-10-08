/* =========================================================
   SUBSTITUTE CHAOS — BATTLE SCREEN
   =========================================================
   Draws the fight from SC.combat.state and handles clicks.
   The rules live in js/engine/combat.js; this file only draws.
   Animations live in js/ui/battle-fx.js.

   How to Play opens the tutorial; the map opens a fight by
   setting SC.currentBattle and going to #battle (see main.js).
   Opening #battle directly starts the tutorial, handy for testing.
   ========================================================= */

window.SC = window.SC || {};

(function () {
    'use strict';

    let root = null;
    let levelId = 'tutorial';
    let resultTimer = null;

    // How long the win/lose message waits so the last hit can play out
    const RESULT_DELAY = 1400;

    // The battle is laid out at this width, then scaled up to fill the window
    const BASE_WIDTH = 720;
    const MAX_SCALE = 1.8;

    // ------- SETUP -------

    // Called by the router when the battle screen loads
    SC.setupBattle = function () {
        root = document.querySelector('.battle-screen');
        if (!root || !SC.combat) {
            return;
        }

        levelId = (SC.currentBattle && SC.currentBattle.levelId)
            || root.dataset.level
            || 'tutorial';

        if (SC.stopMusic) {
            SC.stopMusic();
        }

        // Back link goes to the map for map fights, the title for the tutorial
        const backLink = root.querySelector('.battle__back');
        backLink.href = fromMap() ? '#map' : '#';
        backLink.textContent = fromMap() ? '← Back to Map' : '← Back to Title';

        root.querySelector('.battle__end-turn').addEventListener('click', function () {
            SC.battleFx.mark('endTurn');
            SC.combat.endTurn();
            render();
        });

        startFight();

        fitToScreen();
        setTimeout(fitToScreen, 400);    // again once card images have loaded
        window.addEventListener('resize', fitToScreen);
    };

    // Grow the whole battle to fill the window (never smaller than normal)
    function fitToScreen() {
        // Left the battle screen: stop listening
        if (!root || !document.body.contains(root)) {
            window.removeEventListener('resize', fitToScreen);
            return;
        }

        // Fixed layout width; the page centers it (see #screen[data-screen="battle"])
        const roomWide = window.innerWidth - 48;
        const width = Math.min(BASE_WIDTH, roomWide);
        root.style.width = width + 'px';

        // Measure at normal size first
        root.style.zoom = 1;
        const top = root.getBoundingClientRect().top;
        const height = root.offsetHeight;
        const roomTall = window.innerHeight - top - 12;

        const scale = Math.max(1, Math.min(MAX_SCALE, roomTall / height, roomWide / width));

        root.style.zoom = scale;
        SC.battleScale = scale;          // battle-fx.js uses this to size flying cards
    }

    // Start (or restart) the fight from scratch
    function startFight() {
        clearTimeout(resultTimer);

        const oldResult = root.querySelector('.battle__result');
        if (oldResult) {
            oldResult.remove();
        }

        // Clear the hero so render() builds a fresh one
        root.querySelector('.battle__hero').innerHTML = '';

        SC.combat.start(levelId, chosenTeacher());
        SC.battleFx.reset(SC.combat.state);
        render();
    }

    // True when this fight was opened from a node on the day map
    function fromMap() {
        return Boolean(SC.currentBattle && typeof SC.currentBattle.nodeIndex === 'number');
    }

    // The teacher picked on the title screen. How to Play passes it in
    // directly; map fights read it from the save made by Start a New Day.
    function chosenTeacher() {
        if (SC.currentBattle && SC.currentBattle.heroId) {
            return SC.currentBattle.heroId;
        }
        try {
            const save = JSON.parse(localStorage.getItem('sc-save') || 'null');
            return save && save.teacher;
        } catch (e) {
            return null;
        }
    }

    // Won the fight. Tutorial: back to the title.
    // Map fight: move the map forward one node and go back to it.
    function completeEncounter() {
        if (!fromMap()) {
            SC.currentBattle = null;
            window.location.hash = '';
            return;
        }

        const battle = SC.currentBattle;

        if (battle && SC.days && SC.days.current) {
            const day = SC.days.current;
            let save = null;
            try {
                save = JSON.parse(localStorage.getItem('sc-save') || 'null');
            } catch (e) {
                save = null;
            }

            const nextIndex = battle.nodeIndex + 1;

            if (nextIndex >= day.nodes.length) {
                localStorage.removeItem('sc-save');
            } else {
                localStorage.setItem('sc-save', JSON.stringify(
                    Object.assign({}, save, { dayId: day.id, nodeIndex: nextIndex })
                ));
            }
        }

        SC.currentBattle = null;
        window.location.hash = 'map';
    }

    // ------- DRAWING -------

    function render() {
        const fx = SC.battleFx.snapshot();   // old screen, before it's wiped
        const s = SC.combat.state;
        if (!root || !s) {
            return;
        }

        root.querySelector('.battle__title').textContent = s.level.name;
        root.querySelector('.battle__turn').textContent = 'Turn ' + s.turn;

        renderEnemy(s);

        // Both fields
        fillField(root.querySelector('.battle__field--enemy'), s.enemy.field);
        fillField(root.querySelector('.battle__field--player'), s.player.field);

        renderHero(s);
        renderHand(s);

        // Latest log line
        root.querySelector('.battle__log').textContent = s.log[s.log.length - 1] || '';

        root.querySelector('.battle__end-turn').disabled = Boolean(s.result);

        updateHeroStats(s);
        renderPowers(s);
        updatePiles(s);
        fanHand();
        SC.battleFx.play(fx);                // animate what changed

        showResult(s.result);
    }

    // Enemy, plus the card(s) it will play next
    function renderEnemy(s) {
        const enemyBox = root.querySelector('.battle__enemy');
        enemyBox.innerHTML = '';
        enemyBox.appendChild(makeUnit(s.enemy, 'unit--enemy'));

        const intentBox = root.querySelector('.battle__intent');
        intentBox.innerHTML = '';

        if (s.enemy.sanity > 0 && s.enemy.next && s.enemy.next.length > 0) {
            const label = document.createElement('p');
            label.className = 'battle__intent-label';
            label.textContent = 'Next turn it plays:';
            intentBox.appendChild(label);

            s.enemy.next.forEach(function (card) {
                const slot = document.createElement('div');
                slot.className = 'intent-slot';
                slot.appendChild(SC.renderCard(card));
                intentBox.appendChild(slot);
            });
        }
    }

    // Hero card (built once per fight; stats are updated separately)
    function renderHero(s) {
        const heroBox = root.querySelector('.battle__hero');
        if (heroBox.firstChild) {
            return;
        }
        const hero = SC.getCard(s.player.heroId) || SC.getCard('substitute-teacher');
        if (hero) {
            heroBox.appendChild(SC.renderCard(hero));
        }
    }

    // Your hand of cards
    function renderHand(s) {
        const handBox = root.querySelector('.battle__hand');
        handBox.innerHTML = '';

        s.hand.forEach(function (card, i) {
            const slot = document.createElement('div');
            slot.className = 'hand-slot';
            slot.tabIndex = 0;
            slot.setAttribute('role', 'button');
            slot.setAttribute('aria-label', 'Play ' + card.name);

            if (card.cost > s.player.energy) {
                slot.classList.add('is-unaffordable');
            }

            slot.appendChild(SC.renderCard(card));
            slot.addEventListener('click', function () {
                play(i);
            });
            slot.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    play(i);
                }
            });

            handBox.appendChild(slot);
        });
    }

    // Defenders on a field
    function fillField(box, field) {
        if (!box) return;
        box.innerHTML = '';
        (field || []).forEach(function (unit) {
            box.appendChild(makeUnit(unit, 'unit--defender'));
        });
    }

    // One box for the enemy or a defender: art, name, Sanity bar, numbers
    function makeUnit(unit, extraClass) {
        const sanity = unit.sanity != null ? unit.sanity : (unit.amount || 0);
        const max = unit.maxSanity || sanity || 1;

        const el = document.createElement('div');
        el.className = 'unit ' + extraClass;

        const art = document.createElement('div');
        art.className = 'unit__art';
        art.textContent = unit.art || '🛡️';
        el.appendChild(art);

        const name = document.createElement('p');
        name.className = 'unit__name';
        name.textContent = unit.name;
        el.appendChild(name);

        const bar = document.createElement('div');
        bar.className = 'unit__bar';
        const fill = document.createElement('div');
        fill.className = 'unit__bar-fill';
        fill.style.width = Math.max(0, Math.min(100, (sanity / max) * 100)) + '%';
        bar.appendChild(fill);
        el.appendChild(bar);

        const numbers = document.createElement('p');
        numbers.className = 'unit__numbers';
        numbers.textContent = sanity + ' / ' + max;
        el.appendChild(numbers);

        if (unit.relaxation > 0) {
            const relax = document.createElement('p');
            relax.className = 'unit__relax';
            relax.textContent = '😌 ' + unit.relaxation + ' Relaxation';
            el.appendChild(relax);
        }

        return el;
    }

    // Power cards stay in play in their own zone, next to the field
    function renderPowers(state) {
        fillPowers('.battle__powers--player', state.player.powers || []);
        fillPowers('.battle__powers--enemy', state.enemy.powers || []);
    }

    function fillPowers(selector, powers) {
        const zone = root.querySelector(selector);
        if (!zone) return;

        zone.innerHTML = '';
        powers.forEach(function (card) {
            const slot = document.createElement('div');
            slot.className = 'power-slot';
            slot.title = card.name + ': ' + card.description;
            slot.appendChild(SC.renderCard(card));
            zone.appendChild(slot);
        });
    }

    // Hero card shows your stats instead of an ability.
    // Built the first time it's drawn, then updated every render.
    function updateHeroStats(state) {
        const card = root.querySelector('.battle__hero .card--hero');
        if (!card) return;

        const stats = card.querySelector('.hero-stats') || buildHeroStats(card);
        const p = state.player;

        // Sanity bar
        const pct = Math.max(0, Math.min(100, (p.sanity / p.maxSanity) * 100));
        const fill = stats.querySelector('.hero-stats__fill');
        fill.style.width = pct + '%';
        fill.dataset.level = pct <= 25 ? 'low' : pct <= 50 ? 'mid' : 'high';
        stats.querySelector('.hero-stats__sanity').textContent = p.sanity + '/' + p.maxSanity;

        // Relaxation (dim at 0, blue glow on the card when you have some)
        const relax = stats.querySelector('.hero-stats__relax');
        relax.textContent = p.relaxation;
        relax.closest('.hero-stats__row').classList.toggle('is-zero', p.relaxation === 0);
        card.classList.toggle('has-relaxation', p.relaxation > 0);

        // Coffee: one cup per point, spent cups go gray
        const cups = stats.querySelector('.hero-stats__cups');
        const total = Math.max(p.energy, p.maxEnergy);
        cups.innerHTML = '';
        for (let i = 0; i < total; i++) {
            const cup = document.createElement('span');
            cup.className = 'hero-stats__cup' + (i < p.energy ? '' : ' is-empty');
            cup.textContent = '☕';
            cups.appendChild(cup);
        }
        cups.title = 'Coffee: ' + p.energy + ' / ' + p.maxEnergy;
    }

    // Swap the ability text for the three stat rows
    function buildHeroStats(card) {
        const body = card.querySelector('.card__body');
        body.querySelectorAll('.card__type, .card__description').forEach(function (el) {
            el.remove();
        });

        const stats = document.createElement('div');
        stats.className = 'hero-stats';
        stats.innerHTML =
            '<div class="hero-stats__row" title="Sanity">' +
                '<span class="hero-stats__icon">🧠</span>' +
                '<div class="hero-stats__bar"><div class="hero-stats__fill"></div></div>' +
                '<strong class="hero-stats__sanity"></strong>' +
            '</div>' +
            '<div class="hero-stats__row" title="Relaxation blocks damage this turn">' +
                '<span class="hero-stats__icon">😌</span>' +
                '<span class="hero-stats__label">Relaxation</span>' +
                '<strong class="hero-stats__relax"></strong>' +
            '</div>' +
            '<div class="hero-stats__row">' +
                '<span class="hero-stats__label">Coffee</span>' +
                '<div class="hero-stats__cups"></div>' +
            '</div>';

        body.appendChild(stats);
        return stats;
    }

    // Draw the deck (face down) and discard pile as stacks of notecards
    function updatePiles(state) {
        drawStack('.pile--draw', state.drawPile.length, false);
        drawStack('.pile--discard', state.discard.length, true);
    }

    function drawStack(selector, count, messy) {
        const pile = root.querySelector(selector);
        if (!pile) return;

        const stack = pile.querySelector('.pile__stack');
        const layers = Math.min(count, 6);   // never draw more than 6 cards thick
        stack.innerHTML = '';

        for (let i = 0; i < layers; i++) {
            const back = document.createElement('div');
            back.className = 'pile__card';

            // Draw pile is neat, discard pile is tossed on crooked
            const tilt = messy ? ((i * 37) % 9) - 4 : 0;
            back.style.transform =
                'translate(' + (-i) + 'px, ' + (-i * 2) + 'px) rotate(' + tilt + 'deg)';

            stack.appendChild(back);
        }

        pile.querySelector('.pile__count').textContent = count;
        pile.classList.toggle('is-empty', count === 0);
    }

    // Spread the hand into a fan: middle card straight,
    // outer cards tilted and dropped a little lower
    function fanHand() {
        const slots = root.querySelectorAll('.battle__hand .hand-slot');
        const mid = (slots.length - 1) / 2;

        slots.forEach(function (slot, i) {
            const offset = i - mid;
            slot.style.setProperty('--i', offset);
            slot.style.setProperty('--lift', offset * offset);
        });
    }

    // ------- WIN / LOSE -------

    // Waits a moment so the final hit animates, then shows the message
    function showResult(result) {
        if (!result || root.querySelector('.battle__result')) {
            return;
        }

        clearTimeout(resultTimer);
        resultTimer = setTimeout(function () {
            // Screen may have changed while we waited
            if (!root || !document.body.contains(root) || root.querySelector('.battle__result')) {
                return;
            }

            const won = result === 'win' || result === 'won';
            const level = SC.combat.state.level;

            const box = document.createElement('div');
            box.className = 'battle__result';

            const title = document.createElement('h2');
            title.textContent = won ? 'Class Dismissed!' : 'You Walked Out...';
            box.appendChild(title);

            const text = document.createElement('p');
            text.textContent = won
                ? (level.winText || 'You survived the class!')
                : 'The class got the best of you this time.';
            box.appendChild(text);

            if (won) {
                const next = document.createElement('button');
                next.type = 'button';
                next.className = 'btn btn--primary';
                next.textContent = fromMap() ? 'Back to the Map' : 'Back to Title';
                next.addEventListener('click', completeEncounter);
                box.appendChild(next);
            } else {
                const retry = document.createElement('button');
                retry.type = 'button';
                retry.className = 'btn btn--primary';
                retry.textContent = 'Try Again';
                retry.addEventListener('click', startFight);
                box.appendChild(retry);

                const back = document.createElement('a');
                back.className = 'cards-screen__back';
                back.href = fromMap() ? '#map' : '#';
                back.textContent = fromMap() ? '← Back to Map' : '← Back to Title';
                box.appendChild(back);
            }

            root.appendChild(box);
        }, RESULT_DELAY);
    }

    // ------- CLICKS -------

    function play(handIndex) {
        if (SC.combat.state.result) {
            return;
        }
        if (SC.combat.playCard(handIndex) && SC.playSound) {
            SC.playSound('slam');
        }
        render();
    }

    

})();