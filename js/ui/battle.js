/* =========================================================
   SUBSTITUTE CHAOS — BATTLE SCREEN
   =========================================================
   Draws the fight from SC.combat.state and handles clicks.
   The rules live in js/engine/combat.js; this file only draws.

   The map opens a fight by setting SC.currentBattle and going
   to #battle (see setupMap in js/main.js). Opening #battle
   directly starts the Homeroom tutorial, handy for testing.
   ========================================================= */

window.SC = window.SC || {};

(function () {
    'use strict';

    let root = null;
    let levelId = 'homeroom';

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

        SC.combat.start(levelId, chosenTeacher());
        SC.battleFx.reset(SC.combat.state);

        root.querySelector('.battle__end-turn').addEventListener('click', function () {
            SC.battleFx.mark('endTurn');
            SC.combat.endTurn();
            render();
        });

        render();
    };

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

    // Draw the deck (face down) and discard pile as stacks of notecards
    function updatePiles(state) {
        drawStack('.pile--draw', state.drawPile.length, false);
        drawStack('.pile--discard', state.discard.length, true);
    }

    function drawStack(selector, count, messy) {
        var pile = document.querySelector(selector);
        if (!pile) return;

        var stack = pile.querySelector('.pile__stack');
        var layers = Math.min(count, 6);   // never draw more than 6 cards thick
        stack.innerHTML = '';

        for (var i = 0; i < layers; i++) {
            var back = document.createElement('div');
            back.className = 'pile__card';

            // Draw pile is neat, discard pile is tossed on crooked
            var tilt = messy ? ((i * 37) % 9) - 4 : 0;
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
        var slots = document.querySelectorAll('.battle__hand .hand-slot');
        var mid = (slots.length - 1) / 2;

        slots.forEach(function (slot, i) {
            var offset = i - mid;
            slot.style.setProperty('--i', offset);
            slot.style.setProperty('--lift', offset * offset);
        });
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

        // Enemy, plus the card(s) it will play next
        const enemyBox = root.querySelector('.battle__enemy');
        enemyBox.innerHTML = '';
        enemyBox.appendChild(makeUnit(s.enemy, 'unit--enemy'));

        const intentBox = root.querySelector('.battle__intent');
        intentBox.innerHTML = '';
        if (s.enemy.sanity > 0 && s.enemy.next.length > 0) {
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

        // Both fields
        fillField(root.querySelector('.battle__field--enemy'), s.enemy.field);
        fillField(root.querySelector('.battle__field--player'), s.player.field);

        // Hero card (built once per fight)
        const heroBox = root.querySelector('.battle__hero');
        if (!heroBox.firstChild) {
            const hero = SC.getCard(s.player.heroId) || SC.getCard('substitute-teacher');
            if (hero) {
                heroBox.appendChild(SC.renderCard(hero));
            }
        }

        // Stats
        const stats = root.querySelector('.battle__stats');
        stats.innerHTML = '';
        addStat(stats, '🧠 Sanity', s.player.sanity + ' / ' + s.player.maxSanity);
        addStat(stats, '😌 Relaxation', s.player.relaxation);
        addStat(stats, '☕ Coffee', s.player.energy + ' / ' + s.player.maxEnergy);
        addStat(stats, '📚 Deck', s.drawPile.length + '  ·  Discard ' + s.discard.length);

        // Hand
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

        // Latest log line
        root.querySelector('.battle__log').textContent = s.log[s.log.length - 1] || '';

        root.querySelector('.battle__end-turn').disabled = Boolean(s.result);
        showResult(s.result);

        updatePiles(SC.combat.state);
        fanHand();
        SC.battleFx.play(fx);                // animate what changed
    }
    
    function play(handIndex) {
        if (SC.combat.playCard(handIndex) && SC.playSound) {
            SC.playSound('slam');
        }
        render();
    }

    // The enemy or a defender: art, name, Sanity bar, Relaxation
    function makeUnit(unit, extraClass) {
        const el = document.createElement('div');
        el.className = 'unit ' + extraClass;

        const art = document.createElement('div');
        art.className = 'unit__art';
        art.textContent = unit.art;

        const name = document.createElement('div');
        name.className = 'unit__name';
        name.textContent = unit.name;

        const bar = document.createElement('div');
        bar.className = 'unit__bar';
        const fill = document.createElement('div');
        fill.className = 'unit__bar-fill';
        fill.style.width = Math.round((unit.sanity / unit.maxSanity) * 100) + '%';
        bar.appendChild(fill);

        const numbers = document.createElement('div');
        numbers.className = 'unit__numbers';
        numbers.textContent = unit.sanity + ' / ' + unit.maxSanity;

        el.appendChild(art);
        el.appendChild(name);
        el.appendChild(bar);
        el.appendChild(numbers);

        if (unit.relaxation > 0) {
            const relax = document.createElement('div');
            relax.className = 'unit__relax';
            relax.textContent = '😌 ' + unit.relaxation + ' Relaxation';
            el.appendChild(relax);
        }

        return el;
    }

    function fillField(box, defenders) {
        box.innerHTML = '';
        defenders.forEach(function (defender) {
            box.appendChild(makeUnit(defender, 'unit--defender'));
        });
    }

    function addStat(box, label, value) {
        const row = document.createElement('div');
        row.className = 'battle__stat';
        row.appendChild(document.createTextNode(label + ': '));
        const strong = document.createElement('strong');
        strong.textContent = value;
        row.appendChild(strong);
        box.appendChild(row);
    }

    // ------- WIN / LOSE -------

    function showResult(result) {
        const old = root.querySelector('.battle__result');
        if (old) {
            old.remove();
        }
        if (!result) {
            return;
        }

        const level = SC.combat.state.level;
        const backText = fromMap() ? 'Back to the Map' : 'Back to Title';

        const box = document.createElement('div');
        box.className = 'battle__result';

        const title = document.createElement('h2');
        const text = document.createElement('p');
        box.appendChild(title);
        box.appendChild(text);

        if (result === 'win') {
            title.textContent = 'Class Dismissed!';
            text.textContent = level.winText || 'You won the fight.';

            const next = document.createElement('button');
            next.type = 'button';
            next.className = 'btn btn--primary';
            next.textContent = backText;
            next.addEventListener('click', completeEncounter);
            box.appendChild(next);
        } else {
            title.textContent = 'You Walked Out...';
            text.textContent = 'Your Sanity hit 0.';

            const again = document.createElement('button');
            again.type = 'button';
            again.className = 'btn btn--primary';
            again.textContent = 'Try Again';
            again.addEventListener('click', function () {
                SC.combat.start(levelId, chosenTeacher());
                render();
            });

            const back = document.createElement('a');
            back.href = fromMap() ? '#map' : '#';
            back.className = 'btn btn--secondary';
            back.textContent = backText;

            box.appendChild(again);
            box.appendChild(back);
        }

        root.appendChild(box);
    }

})();