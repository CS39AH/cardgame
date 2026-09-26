/* =========================================================
   SUBSTITUTE CHAOS — ORBITING SCHOOL SUPPLIES
   =========================================================
   Decorative title screen effect. School supply emojis
   circle the demo card slot in an ellipse. Items at the top
   of the orbit (the "back") are smaller and fainter, items
   at the bottom (the "front") are bigger and brighter.

   The router calls SC.startOrbit() when the title screen
   shows and SC.stopOrbit() when it leaves.

   To add or remove supplies, edit the SUPPLIES list.
   ========================================================= */

window.SC = window.SC || {};

(function () {
    'use strict';

    // ------- CONFIG -------

    const SUPPLIES = [
        '✏️',  // pencil
        '📏',  // ruler
        '📎',  // paperclip
        '📚',  // books
        '✂️',  // scissors
        '📐',  // triangle ruler
        '🖍️',  // crayon
        '🎒',  // backpack
        '🍎',  // apple for the teacher
        '📓',  // notebook
        '🖊️',  // pen
        '🧮',  // abacus
        '🔔',  // school bell
        '📝'   // pop quiz
    ];

    const ORBIT_SECONDS = 60;   // time for one full lap
    const GAP_X = 70;           // how far past the card's sides the orbit goes
    const GAP_Y = 55;           // how far past the card's top/bottom the orbit goes
    const EDGE_MARGIN = 30;     // keep items this far from the screen edge

    // ------- STATE -------

    let items = [];
    let slot = null;
    let radiusX = 0;
    let radiusY = 0;
    let frameId = null;
    let reduceMotion = false;

    // ------- SIZING -------

    function measure() {
        if (!slot) {
            return;
        }
        const rect = slot.getBoundingClientRect();
        const maxX = window.innerWidth / 2 - EDGE_MARGIN;

        radiusX = Math.min(rect.width / 2 + GAP_X, maxX);
        radiusY = rect.height / 2 + GAP_Y;
    }

    // ------- DRAWING -------

    function draw(timeMs) {
        const t = timeMs / 1000;
        const lap = (t / ORBIT_SECONDS) * Math.PI * 2;

        items.forEach(function (item) {
            const angle = lap + item.startAngle;

            // Position on the ellipse, plus a small up-and-down bob
            const bob = Math.sin(t * 1.5 + item.bobPhase) * 6;
            const x = Math.cos(angle) * radiusX * item.radiusJitter;
            const y = Math.sin(angle) * radiusY * item.radiusJitter + bob;

            // 0 at the top of the orbit (back), 1 at the bottom (front)
            const depth = (Math.sin(angle) + 1) / 2;
            const scale = 0.8 + depth * 0.3;
            const opacity = 0.45 + depth * 0.45;

            // Gentle back-and-forth tilt
            const tilt = Math.sin(t + item.bobPhase) * 15 * item.tiltDir;

            item.el.style.transform =
                'translate(-50%, -50%) ' +
                'translate(' + x + 'px, ' + y + 'px) ' +
                'rotate(' + tilt + 'deg) ' +
                'scale(' + scale + ')';
            item.el.style.opacity = opacity;
        });
    }

    function loop(timeMs) {
        draw(timeMs);
        frameId = requestAnimationFrame(loop);
    }

    function onResize() {
        measure();
        if (reduceMotion) {
            draw(0);
        }
    }

    // ------- PUBLIC -------

    SC.startOrbit = function () {
        SC.stopOrbit();

        const orbit = document.getElementById('orbit');
        slot = document.getElementById('demo-card');

        if (!orbit || !slot) {
            return; // not on the title screen
        }

        reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Build one element per supply, spaced evenly around the ellipse.
        // Each gets its own random wobble so they don't move in lockstep.
        orbit.innerHTML = '';
        items = SUPPLIES.map(function (emoji, i) {
            const el = document.createElement('span');
            el.className = 'orbit__item';
            el.textContent = emoji;
            orbit.appendChild(el);

            return {
                el: el,
                startAngle: (i / SUPPLIES.length) * Math.PI * 2,
                radiusJitter: 0.92 + Math.random() * 0.16,
                bobPhase: Math.random() * Math.PI * 2,
                tiltDir: Math.random() < 0.5 ? -1 : 1
            };
        });

        measure();
        window.addEventListener('resize', onResize);

        if (reduceMotion) {
            draw(0);
        } else {
            frameId = requestAnimationFrame(loop);
        }
    };

    SC.stopOrbit = function () {
        if (frameId !== null) {
            cancelAnimationFrame(frameId);
            frameId = null;
        }
        window.removeEventListener('resize', onResize);
        items = [];
        slot = null;
    };

})();