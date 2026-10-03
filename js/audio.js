/* =========================================================
   SUBSTITUTE CHAOS — SOUND EFFECTS + MUSIC
   =========================================================
   Sound effects are generated in the browser with the Web
   Audio API. Background music plays from audio/.

   Play a sound:        SC.playSound('eraser')
   Start/stop music:    SC.startMusic() / SC.stopMusic()
   Music volume:        SC.setMusicVolume(0.5)

   Browsers block sound until the player has clicked, tapped,
   or pressed a key at least once, so the first interaction
   "unlocks" audio and starts the music.

   iPhone note: sound effects are muted when the ring/silent
   switch is set to silent.
   ========================================================= */

window.SC = window.SC || {};

(function () {
    'use strict';

    // ------- CONFIG -------

    const VOLUME = 0.35;                       // sound effects, 0 to 1
    const MUSIC_DEFAULT_VOLUME = 0.15;         // starting music volume, 0 to 1
    const MUSIC_FADE_MS = 1500;                // music fade-in time
    const MUSIC_SRC = 'audio/mainmenumusic.mp3';
    const MUSIC_VOLUME_KEY = 'sc-music-volume'; // remembers the slider setting

    SC.soundEnabled = true;

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

    // One second of random static, reused by the scratchy sounds
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

    // One pure tone that strikes and rings out (used for the bell)
    function tone(ac, start, freq, duration, peak) {
        const osc = ac.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        const gain = ac.createGain();
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(peak, start + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

        osc.connect(gain);
        gain.connect(ac.destination);

        osc.start(start);
        osc.stop(start + duration + 0.05);
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
        },

        // A card slapped onto the chalkboard: low thud plus a tiny paper snap
        slam: function (ac) {
            const t = ac.currentTime + 0.01;
            stroke(ac, t,  0.14,  420,  110, VOLUME * 1.3);
            stroke(ac, t,  0.04, 3200, 2400, VOLUME * 0.35);
        },

        // Red pen ticking a check mark: short down stroke, longer flick up
        penCheck: function (ac) {
            const t = ac.currentTime + 0.01;
            stroke(ac, t,        0.06, 2600, 3800, VOLUME * 0.55);
            stroke(ac, t + 0.07, 0.15, 3400, 6000, VOLUME * 0.45);
        },

        // Picking up the clipboard: paper shuffle, then the metal clip snaps
        clipboard: function (ac) {
            const t = ac.currentTime + 0.02;
            stroke(ac, t,        0.12, 1100, 2200, VOLUME * 0.6);
            stroke(ac, t + 0.10, 0.16, 1600,  900, VOLUME * 0.5);
            stroke(ac, t + 0.30, 0.05, 2400,  700, VOLUME * 1.1);
        },

        // Setting the clipboard down: soft clip release, then paper slides away
        clipboardDown: function (ac) {
            const t = ac.currentTime + 0.02;
            stroke(ac, t,        0.04, 1800,  900, VOLUME * 0.7);
            stroke(ac, t + 0.06, 0.30, 2200,  500, VOLUME * 0.5);
        },

        // Hovering a menu button: a soft tap of chalk on the board
        chalkTap: function (ac) {
            const t = ac.currentTime + 0.005;
            stroke(ac, t, 0.03, 3000, 2000, VOLUME * 0.35);
        },

        // Pressing a menu button: a firmer chalk click
        chalkClick: function (ac) {
            const t = ac.currentTime + 0.005;
            stroke(ac, t, 0.035, 1800,  900, VOLUME * 0.8);
            stroke(ac, t, 0.02,  4000, 3000, VOLUME * 0.3);
        },

        // Electric school bell: the hammer strikes fast, then it rings out.
        // The three tones per strike are spaced like a real metal bell.
        bell: function (ac) {
            const t = ac.currentTime + 0.02;
            const strikes = 26;
            const gap = 0.045;
            const base = 1050;

            for (let i = 0; i < strikes; i++) {
                const s = t + i * gap;
                const fade = 1 - (i / strikes) * 0.6;
                tone(ac, s, base,        0.18, VOLUME * 0.22 * fade);
                tone(ac, s, base * 2.76, 0.10, VOLUME * 0.10 * fade);
                tone(ac, s, base * 5.4,  0.06, VOLUME * 0.05 * fade);
            }

            // Final ring-out after the hammer stops
            const end = t + strikes * gap;
            tone(ac, end, base,        0.9, VOLUME * 0.15);
            tone(ac, end, base * 2.76, 0.5, VOLUME * 0.06);
        }
    };

    // ------- PLAYING SOUNDS -------

    // ifReady: true skips the sound if audio isn't unlocked yet.
    // Use it for hover sounds, so they don't pile up and all play
    // at once on the player's first click.
    SC.playSound = function (name, ifReady) {
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

        if (ifReady) {
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
    };

    // ------- MUSIC -------

    const music = new Audio(MUSIC_SRC);
    music.loop = true;
    music.preload = 'auto';
    music.volume = 0;

    let musicWanted = false;
    let fadeFrame = null;

    // Smoothly change the music volume over ms milliseconds
    function fadeMusicTo(target, ms) {
        cancelAnimationFrame(fadeFrame);
        const from = music.volume;
        const startTime = performance.now();

        function step(now) {
            const progress = Math.min((now - startTime) / ms, 1);
            music.volume = from + (target - from) * progress;
            if (progress < 1) {
                fadeFrame = requestAnimationFrame(step);
            }
        }

        fadeFrame = requestAnimationFrame(step);
    }

    // Music needs a real click/tap to start, so if the browser blocks it,
    // try again on the player's next interaction.
    const MUSIC_UNLOCK_EVENTS = ['pointerup', 'touchend', 'click', 'keydown'];

    function addMusicUnlock() {
        MUSIC_UNLOCK_EVENTS.forEach(function (type) {
            window.addEventListener(type, playMusic);
        });
    }

    function removeMusicUnlock() {
        MUSIC_UNLOCK_EVENTS.forEach(function (type) {
            window.removeEventListener(type, playMusic);
        });
    }

    function playMusic() {
        if (!musicWanted || !music.paused) {
            return;
        }

        music.play()
            .then(function () {
                removeMusicUnlock();
                fadeMusicTo(musicVolume, MUSIC_FADE_MS);
            })
            .catch(function () {
                addMusicUnlock();
            });
    }

    SC.startMusic = function () {
        musicWanted = true;
        playMusic();
    };

    SC.stopMusic = function () {
        musicWanted = false;
        removeMusicUnlock();
        fadeMusicTo(0, 600);
        setTimeout(function () {
            if (!musicWanted) {
                music.pause();
            }
        }, 650);
    };

    // ------- MUSIC VOLUME SLIDER -------
    // Controls the music only. Sound effects always play at full level.

    let musicVolume = MUSIC_DEFAULT_VOLUME;
    try {
        const saved = parseFloat(localStorage.getItem(MUSIC_VOLUME_KEY));
        if (!isNaN(saved)) {
            musicVolume = Math.min(Math.max(saved, 0), 1);
        }
    } catch (e) {
        // Storage blocked (private window, etc.). Use the default.
    }

    function volumeIcon(value) {
        if (value === 0)  { return '🔇'; }
        if (value < 0.34) { return '🔈'; }
        if (value < 0.67) { return '🔉'; }
        return '🔊';
    }

    function updateVolumeUI() {
        const percent = Math.round(musicVolume * 100);
        const button = document.getElementById('volume-toggle');
        const slider = document.getElementById('music-volume');
        const label = document.getElementById('music-volume-value');

        if (button) {
            button.textContent = volumeIcon(musicVolume);
        }
        if (slider) {
            slider.value = percent;
            slider.setAttribute('aria-valuetext', percent + '%');
        }
        if (label) {
            label.textContent = percent + '%';
        }
    }

    SC.setMusicVolume = function (value) {
        musicVolume = Math.min(Math.max(value, 0), 1);

        // Stop any fade in progress so the slider takes over right away
        cancelAnimationFrame(fadeFrame);
        if (!music.paused) {
            music.volume = musicVolume;
        }

        try {
            localStorage.setItem(MUSIC_VOLUME_KEY, String(musicVolume));
        } catch (e) {
            // Storage blocked. The setting just won't be remembered.
        }

        updateVolumeUI();
    };

    const volumeControl = document.getElementById('volume-control');
    const volumeButton = document.getElementById('volume-toggle');
    const volumeSlider = document.getElementById('music-volume');

    function setPanelOpen(open) {
        volumeControl.classList.toggle('is-open', open);
        volumeButton.setAttribute('aria-expanded', open);
    }

    if (volumeControl && volumeButton && volumeSlider) {
        // Speaker button opens and closes the slider
        volumeButton.addEventListener('click', function (e) {
            e.stopPropagation();
            setPanelOpen(!volumeControl.classList.contains('is-open'));
        });

        // Moving the slider changes the music volume
        volumeSlider.addEventListener('input', function () {
            SC.setMusicVolume(volumeSlider.value / 100);
        });

        // Close when clicking anywhere else, or pressing Escape
        document.addEventListener('click', function (e) {
            if (!volumeControl.contains(e.target)) {
                setPanelOpen(false);
            }
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                setPanelOpen(false);
            }
        });
    }

    updateVolumeUI();

})();