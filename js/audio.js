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
    const SFX_VOLUME_KEY = 'sc-sfx-volume';     // remembers the sound effects slider

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
            loadSoundFiles(ctx);
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

    // Every sound effect plays through this one volume knob,
    // which the Sounds slider turns up and down.
    let sfxBus = null;
    let sfxVolume = 1;
    try {
        const savedSfx = parseFloat(localStorage.getItem(SFX_VOLUME_KEY));
        if (!isNaN(savedSfx)) {
            sfxVolume = Math.min(Math.max(savedSfx, 0), 1);
        }
    } catch (e) {
        // Storage blocked. Use full volume.
    }

    function getSfxBus(ac) {
        if (!sfxBus) {
            sfxBus = ac.createGain();
            sfxBus.gain.value = sfxVolume;
            sfxBus.connect(ac.destination);
        }
        return sfxBus;
    }

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
        gain.connect(getSfxBus(ac));

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
        gain.connect(getSfxBus(ac));

        osc.start(start);
        osc.stop(start + duration + 0.05);
    }

    // ------- SOUND FILES -------
    // Real recorded sounds from the audio folder. They load once when
    // sound starts, then play through the same Sounds slider as the rest.
    const SOUND_FILES = {
        shieldUp: { src: 'audio/shieldsound.mp3', volume: 0.4 },
        petJump:  { src: 'audio/hamster_jump.mp3', volume: 0.3 },
        'home-bell': {src: 'audio/bell.mp3', volume: 0.4}
    };
    const fileBuffers = {};

    function loadSoundFiles(ac) {
        Object.keys(SOUND_FILES).forEach(function (name) {
            fetch(SOUND_FILES[name].src)
                .then(function (res) { return res.arrayBuffer(); })
                .then(function (data) { return ac.decodeAudioData(data); })
                .then(function (buffer) { fileBuffers[name] = buffer; })
                .catch(function (err) { console.warn('Sound Failed to load:, name, err'); });
        });
    }

    // Plays a loaded file. Returns false if it isn't loaded (yet).
    function playFile(ac, name) {
        const buffer = fileBuffers[name];
        if (!buffer) return false;

        const source = ac.createBufferSource();
        source.buffer = buffer;
        const gain = ac.createGain();
        gain.gain.value = SOUND_FILES[name].volume;
        source.connect(gain);
        gain.connect(getSfxBus(ac));
        source.start();
        return true;
    }

    // A piece of metal ringing: a few out-of-tune pitches stacked
    // together (that's what makes it sound like metal, not music).
    // High pitches fade faster than low ones, like a real shield.
    function metal(ac, start, base, duration, peak) {
        const parts = [1, 1.47, 2.09, 2.56, 3.32, 4.18];
        parts.forEach(function (ratio, i) {
            const loudness = peak / (1 + i * 0.7);
            const length = duration / (1 + i * 0.35);
            tone(ac, start, base * ratio, length, loudness);
        });
    }

    // ------- SOUNDS -------

    const SOUNDS = {
        // Eraser on a chalkboard: one stroke across, one stroke back
        eraser: function (ac) {
            const t = ac.currentTime + 0.02;
            stroke(ac, t,        0.28,  900, 2200, VOLUME);
            stroke(ac, t + 0.30, 0.32, 2000,  800, VOLUME * 0.8);
        },

        // Paper ripping: a fast, bright scratch with a crackly tail
        rip: function (ac) {
            const t = ac.currentTime + 0.01;
            stroke(ac, t,        0.10, 2500, 5200, VOLUME * 0.9);
            stroke(ac, t + 0.06, 0.20, 4200, 1400, VOLUME * 0.7);
        },

        // Ripping all the way through (a card at 0 Sanity): lots of tiny
        // paper-fiber snaps over a scratchy "rrrrip", speeding up, then
        // a final snap as the two halves come apart
        ripApart: function (ac) {
            const t = ac.currentTime + 0.02;
            const length = 0.7;

            // The scratchy body of the tear under the crackles
            stroke(ac, t, length, 1100, 3400, VOLUME * 0.4);

            // Fiber snaps: random little cracks, closer together as it goes
            let at = 0;
            while (at < length) {
                const progress = at / length;
                const freq = 1600 + Math.random() * 3800;
                stroke(ac, t + at,
                    0.015 + Math.random() * 0.035,
                    freq,
                    freq * (0.6 + Math.random() * 0.8),
                    VOLUME * (0.35 + Math.random() * 0.45) * (0.7 + progress * 0.6));
                at += 0.035 - progress * 0.022 + Math.random() * 0.015;
            }

            // Final pull apart
            stroke(ac, t + length, 0.14, 5200, 900, VOLUME);
        },

        // Stepping back from the board: one soft swoosh, high to low
        whoosh: function (ac) {
            const t = ac.currentTime + 0.02;
            stroke(ac, t, 0.45, 3000, 600, VOLUME * 0.7);
        },

        // A defender bracing: "shhk-CHUNK", a shield sliding up and locking into place
        shieldUp: function (ac) {
            if (playFile(ac, 'shieldUp')) return;    // audio/shieldsound.mp3

            // Backup if the file is missing
            const t = ac.currentTime + 0.01;
            stroke(ac, t,        0.16, 2600, 1100, VOLUME * 0.45);   // shhk: slides up
            stroke(ac, t + 0.15, 0.14, 380,  110,  VOLUME * 1.3);    // CHUNK: locks in
            stroke(ac, t + 0.15, 0.04, 3600, 2400, VOLUME * 0.4);    // the latch clicking
            metal(ac, t + 0.15, 210, 0.16, VOLUME * 0.12);           // short, dull metal (no bell ring)
        },

        // Something hits a defender: a heavy CLANG on a metal shield
        shieldHit: function (ac) {
            const t = ac.currentTime + 0.01;
            stroke(ac, t, 0.12, 420, 140, VOLUME * 1.4);      // the thump of the hit
            stroke(ac, t, 0.05, 4200, 2600, VOLUME * 0.6);    // the sharp clank
            metal(ac, t, 330, 0.55, VOLUME * 0.22);           // the shield ringing
        },

        // Teacher's Pet jumping out (audio/hamster_jump.mp3)
        petJump: function (ac) {
            if (playFile(ac, 'petJump')) return;

            // Backup if the file is missing: a tiny "eep!"
            const t = ac.currentTime + 0.01;
            tone(ac, t,        1800, 0.06, VOLUME * 0.12);
            tone(ac, t + 0.05, 2400, 0.08, VOLUME * 0.10);
        },

        // A small stone spear: a quick thrust, then the stone tip
        // cracking into the target with a short knock
        spearStab: function (ac) {
            const t = ac.currentTime + 0.01;
            stroke(ac, t,        0.09, 1200, 4500, VOLUME * 0.35);   // the thrust
            stroke(ac, t + 0.07, 0.05, 2200,  900, VOLUME * 0.9);    // stone tip cracks in
            stroke(ac, t + 0.07, 0.10,  500,  160, VOLUME * 1.0);    // knock of the hit
            tone(ac,   t + 0.07, 760,  0.06, VOLUME * 0.12);         // stony click
            tone(ac,   t + 0.07, 1130, 0.04, VOLUME * 0.08);
        },

        // A Power switching on: an electric crackle with a quick rising hum
        powerUp: function (ac) {
            const t = ac.currentTime + 0.01;
            for (let i = 0; i < 6; i++) {
                stroke(ac, t + i * 0.035, 0.05, 5200, 2600, VOLUME * 0.3);
            }
            tone(ac, t,        440,  0.25, VOLUME * 0.12);
            tone(ac, t + 0.05, 880,  0.30, VOLUME * 0.10);
            tone(ac, t + 0.10, 1760, 0.35, VOLUME * 0.06);
        },

        // Coach's whistle: "tweet-TWEEEET". A high tone with a fast wobble
        // (that's the little ball rattling inside), plus a bit of breath
        whistle: function (ac) {
            const t = ac.currentTime + 0.01;

            function blast(start, length) {
                const osc = ac.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(2900, start);

                // The rattle: wobble the pitch up and down ~38 times a second
                const rattle = ac.createOscillator();
                rattle.frequency.value = 38;
                const rattleDepth = ac.createGain();
                rattleDepth.gain.value = 170;
                rattle.connect(rattleDepth);
                rattleDepth.connect(osc.frequency);

                const gain = ac.createGain();
                gain.gain.setValueAtTime(0.0001, start);
                gain.gain.exponentialRampToValueAtTime(VOLUME * 0.28, start + 0.02);
                gain.gain.setValueAtTime(VOLUME * 0.28, start + length - 0.05);
                gain.gain.exponentialRampToValueAtTime(0.0001, start + length);

                osc.connect(gain);
                gain.connect(getSfxBus(ac));
                osc.start(start);
                rattle.start(start);
                osc.stop(start + length + 0.05);
                rattle.stop(start + length + 0.05);

                // Breath through the whistle
                stroke(ac, start, length, 2600, 3400, VOLUME * 0.22);
            }

            blast(t, 0.16);           // tweet
            blast(t + 0.22, 0.45);    // TWEEEET
        },

        // A Power soaking up a hit (Track Record, Padded Walls): a soft padded
        // "bwomp" with a low hum, then a little rising chime as it holds
        mitigate: function (ac) {
            const t = ac.currentTime + 0.01;
            stroke(ac, t, 0.12, 320, 90, VOLUME * 1.1);      // padded bwomp
            tone(ac, t, 150, 0.22, VOLUME * 0.3);            // low hum
            tone(ac, t + 0.05, 660, 0.25, VOLUME * 0.09);    // chime up
            tone(ac, t + 0.10, 990, 0.30, VOLUME * 0.07);
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
        },
        'home-bell': function (ac) {
            if (playFile(ac, 'home-bell')) return;
            SOUNDS.bell(ac);
        }
    };

    // ------- PLAYING SOUNDS -------

    // ifReady: true skips the sound if audio isn't unlocked yet.
    // Use it for hover sounds, so they don't pile up and all play
    // at once on the player's first click.
    SC.playSound = function (name, ifReady) {
        if (name === 'bell') console.trace('bell requested');
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
            // Clamp to 0–1: the first animation frame can arrive a hair
            // before startTime, which made the volume slightly negative
            const progress = Math.min(Math.max((now - startTime) / ms, 0), 1);
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

        // Sounds slider: changes the sound effects volume and plays a
        // quick chalk tap so you can hear the new level
        const sfxSlider = document.getElementById('sfx-volume');
        let lastPreview = 0;
        if (sfxSlider) {
            sfxSlider.addEventListener('input', function () {
                SC.setSfxVolume(sfxSlider.value / 100);

                const now = Date.now();
                if (now - lastPreview > 120) {
                    lastPreview = now;
                    SC.playSound('chalkClick');
                }
            });
        }

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

    // ------- SOUND EFFECTS VOLUME SLIDER -------

    function updateSfxUI() {
        const percent = Math.round(sfxVolume * 100);
        const slider = document.getElementById('sfx-volume');
        const label = document.getElementById('sfx-volume-value');

        if (slider) {
            slider.value = percent;
            slider.setAttribute('aria-valuetext', percent + '%');
        }
        if (label) {
            label.textContent = percent + '%';
        }
    }

    SC.setSfxVolume = function (value) {
        sfxVolume = Math.min(Math.max(value, 0), 1);

        if (sfxBus) {
            sfxBus.gain.value = sfxVolume;
        }

        try {
            localStorage.setItem(SFX_VOLUME_KEY, String(sfxVolume));
        } catch (e) {
            // Storage blocked. The setting just won't be remembered.
        }

        updateSfxUI();
    };

    updateVolumeUI();
    updateSfxUI();

    // Start loading sound files right away instead of waiting for the first click
    try { getContext(); } catch (e) { /* no audio support */ }

})();