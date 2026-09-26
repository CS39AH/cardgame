/* =========================================================
   SUBSTITUTE CHAOS — SOUND EFFECTS
   =========================================================
   Sounds are generated in the browser with the Web Audio API,
   so there are no sound files to download yet.

   Play a sound from anywhere with: SC.playSound('eraser')

   Browsers block sound until the player has clicked, tapped,
   or pressed a key at least once, so the first interaction
   "unlocks" audio. Opening #cards directly from a bookmark
   stays silent until the player taps something.

   iPhone note: sounds are muted when the ring/silent switch
   is set to silent.
   ========================================================= */

window.SC = window.SC || {};

(function () {
    'use strict';

    // ------- CONFIG -------

    const VOLUME = 0.35;       // 0 to 1
    SC.soundEnabled = true;    // flip to false to mute everything

    // ------- AUDIO SETUP -------

    let ctx = null;
    let noiseBuffer = null;

    function getContext() {
        if (!ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) {
                return null; // very old browser, no sound
            }
            ctx = new AudioCtx();
        }
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
        return ctx;
    }

    // Unlock audio on the player's first click, tap, or key press.
    // Phones only count a tap once the finger lifts, so we listen
    // for several events and stop once audio is running.
    const UNLOCK_EVENTS = ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'];

    function unlock() {
        const ac = getContext();
        if (!ac) {
            return;
        }

        // iPhones unlock most reliably when a sound actually starts
        // during the tap, so play a tiny silent one right now.
        const silent = ac.createBuffer(1, 1, ac.sampleRate);
        const source = ac.createBufferSource();
        source.buffer = silent;
        source.connect(ac.destination);
        source.start(0);

        if (ac.state === 'running') {
            UNLOCK_EVENTS.forEach(function (type) {
                window.removeEventListener(type, unlock);
            });
        }
    }

    UNLOCK_EVENTS.forEach(function (type) {
        window.addEventListener(type, unlock);
    });

    // One second of random static, reused by every sound
    function getNoise(ac) {
        if (noiseBuffer) {
            return noiseBuffer;
        }
        const length = ac.sampleRate;
        noiseBuffer = ac.createBuffer(1, length, ac.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < length; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return noiseBuffer;
    }

    // One swipe: static through a filter that sweeps from one pitch
    // to another, fading in and out. That's what gives it the
    // scratchy "rubbing" sound.
    function stroke(ac, start, duration, fromFreq, toFreq, peak) {
        const source = ac.createBufferSource();
        source.buffer = getNoise(ac);

        const filter = ac.createBiquadFilter();
        filter.type = 'bandpass';
        filter.Q.value = 0.9;
        filter.frequency.setValueAtTime(fromFreq, start);
        filter.frequency.exponentialRampToValueAtTime(toFreq, start + duration);

        const gain = ac.createGain();
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(peak, start + duration * 0.25);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(ac.destination);

        // Start at a random spot in the static so each play sounds slightly different
        source.start(start, Math.random() * 0.5);
        source.stop(start + duration + 0.05);
    }

    // ------- SOUNDS -------

    const SOUNDS = {
        // Eraser on a chalkboard: one stroke across, one stroke back
        eraser: function (ac) {
            const t = ac.currentTime + 0.02;
            stroke(ac, t,        0.28,  900, 2200, VOLUME);
            stroke(ac, t + 0.30, 0.32, 2000,  800, VOLUME * 0.8);
        },

        // Stepping back from the board: one soft swoosh, high to low
        whoosh: function (ac) {
            const t = ac.currentTime + 0.02;
            stroke(ac, t, 0.45, 3000, 600, VOLUME * 0.7);
        }
    };

    // ------- PUBLIC -------

    SC.playSound = function (name) {
        if (!SC.soundEnabled || !SOUNDS[name]) {
            return;
        }

        const ac = getContext();
        if (!ac) {
            return;
        }

        if (ac.state === 'running') {
            SOUNDS[name](ac);
            return;
        }

        // Audio is still waking up (common on the very first tap on phones).
        // Wait for it instead of skipping the sound.
        ac.resume()
            .then(function () {
                if (ac.state === 'running') {
                    SOUNDS[name](ac);
                }
            })
            .catch(function () {
                // Browser refused, e.g. page opened with no tap yet. Stay silent.
            });
    }

})();