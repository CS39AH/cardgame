/*
 * SETTINGS SCREEN
 * ---------------
 * The ⚙️ button in the top-right corner (on every screen, the battle
 * included) opens a Settings window with:
 *   - Music and Sounds sliders (their volume code is in js/audio.js)
 *   - "Reduce animations" checkbox
 *
 * Reduce animations:
 *   The game ignores the computer's own "reduce motion" setting, so
 *   animations are ON for everyone by default. This checkbox is the only
 *   way to turn them down. It's remembered between visits (localStorage),
 *   and index.html reads it before anything else loads.
 *     SC.REDUCE_ANIMATIONS          true/false, read by battle-fx.js,
 *                                   main.js and orbit.js
 *     <html class="reduce-animations">  turns off CSS animations (styles.css)
 */

window.SC = window.SC || {};

(function () {
    'use strict';

    const REDUCE_KEY = 'sc-reduce-animations';

    const openBtn = document.getElementById('settings-open');
    const overlay = document.getElementById('settings');
    const closeBtn = document.getElementById('settings-close');
    const doneBtn = document.getElementById('settings-done');
    const reduceBox = document.getElementById('reduce-animations');

    if (!openBtn || !overlay) {
        return;
    }

    // ------- OPEN / CLOSE -------

    function open() {
        overlay.hidden = false;
        if (SC.playSound) SC.playSound('clipboard', true);
        // Put keyboard focus inside so Tab and Escape work right away
        (closeBtn || doneBtn).focus();
    }

    function close() {
        if (overlay.hidden) return;
        overlay.hidden = true;
        if (SC.playSound) SC.playSound('clipboardDown', true);
        openBtn.focus();
    }

    openBtn.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (doneBtn) doneBtn.addEventListener('click', close);

    // Click the dark area around the window, or press Escape, to close
    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) close();
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') close();
    });

    // ------- REDUCE ANIMATIONS -------

    SC.setReduceAnimations = function (on) {
        SC.REDUCE_ANIMATIONS = Boolean(on);
        document.documentElement.classList.toggle('reduce-animations', SC.REDUCE_ANIMATIONS);

        try {
            localStorage.setItem(REDUCE_KEY, SC.REDUCE_ANIMATIONS ? '1' : '0');
        } catch (e) {
            // Storage blocked. The setting just won't be remembered.
        }
    };

    if (reduceBox) {
        reduceBox.checked = Boolean(SC.REDUCE_ANIMATIONS);
        reduceBox.addEventListener('change', function () {
            SC.setReduceAnimations(reduceBox.checked);
        });
    }
})();