/*
 * SAVE SYSTEM
 * -----------
 * The ONLY file that reads or writes the save in localStorage.
 * Everything else uses these functions:
 *
 *   SC.save.load()          -> the save you're playing (or null)
 *   SC.save.update({...})   -> change some fields and autosave
 *   SC.save.startNew(slot, teacherId) -> fresh game in a slot
 *   SC.save.beat(levelId)   -> remember a zone/level was beaten
 *   SC.save.list()          -> all 3 slots (null = empty), for the saves screen
 *   SC.save.use(slot)       -> pick which slot you're playing
 *   SC.save.remove(slot)    -> delete a slot
 *   SC.save.describe(save)  -> "Gym Class · Zone 2 of 3" for the saves screen
 *
 * One save looks like:
 *   {
 *     version: 1,
 *     teacher: 'gym-teacher',
 *     dayId: 'day-1',
 *     nodeIndex: 3,         // locations finished on the day map
 *     zoneNode: 3,          // location whose zones you're inside (or null)
 *     zoneIndex: 1,         // zones finished inside it
 *     playerDeck: [...],    // card ids, starting deck + rewards
 *     beaten: ['gym-warmup', ...],   // every level beaten (for unlocking later)
 *     dayComplete: false,
 *     created: 1731690000000,
 *     lastPlayed: 1731690000000
 *   }
 *
 * Everything lives in this browser only. Clearing site data erases it.
 */

window.SC = window.SC || {};

(function () {
    'use strict';

    const KEY = 'sc-saves';            // all 3 slots
    const ACTIVE_KEY = 'sc-save-slot'; // which slot you're playing
    const OLD_KEY = 'sc-save';         // the old single save, moved into slot 1
    const VERSION = 1;
    const SLOTS = 3;

    // ---------- reading and writing localStorage ----------

    function readAll() {
        let slots;
        try {
            slots = JSON.parse(localStorage.getItem(KEY) || 'null');
        } catch (e) {
            slots = null;
        }
        if (!Array.isArray(slots)) slots = [];
        while (slots.length < SLOTS) slots.push(null);
        return slots.slice(0, SLOTS).map(upgrade);
    }

    function writeAll(slots) {
        try {
            localStorage.setItem(KEY, JSON.stringify(slots));
        } catch (e) {
            console.warn('Could not save the game:', e);
        }
    }

    function activeSlot() {
        const n = parseInt(localStorage.getItem(ACTIVE_KEY), 10);
        return n >= 0 && n < SLOTS ? n : null;
    }

    // Older saves get any fields they're missing, so they don't break
    // the game when we add new things later. Bump VERSION when you
    // change the format and add the fix here.
    function upgrade(save) {
        if (!save || typeof save !== 'object') return null;
        return Object.assign({
            version: VERSION,
            teacher: null,
            dayId: SC.days && SC.days.current ? SC.days.current.id : 'day-1',
            nodeIndex: 0,
            zoneNode: null,
            zoneIndex: 0,
            playerDeck: null,
            beaten: [],
            dayComplete: false,
            created: Date.now(),
            lastPlayed: Date.now()
        }, save, { version: VERSION });
    }

    // The old one-save format ('sc-save') moves into slot 1 once
    (function moveOldSave() {
        try {
            const old = JSON.parse(localStorage.getItem(OLD_KEY) || 'null');
            if (old && !localStorage.getItem(KEY)) {
                const slots = readAll();
                slots[0] = upgrade(old);
                writeAll(slots);
                localStorage.setItem(ACTIVE_KEY, '0');
            }
            localStorage.removeItem(OLD_KEY);
        } catch (e) { /* nothing to move */ }
    })();

    // ---------- the "Saved ✓" note in the corner ----------

    let toastTimer = null;
    function showSaved() {
        let note = document.querySelector('.save-toast');
        if (!note) {
            note = document.createElement('div');
            note.className = 'save-toast';
            note.textContent = 'Saved ✓';
            note.setAttribute('role', 'status');
            document.body.appendChild(note);
        }
        note.classList.remove('is-showing');
        void note.offsetWidth;
        note.classList.add('is-showing');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { note.classList.remove('is-showing'); }, 1800);
    }

    // ---------- the functions everyone else uses ----------

    SC.save = {
        SLOTS: SLOTS,

        // The save you're playing right now, or null
        load: function () {
            const slot = activeSlot();
            return slot === null ? null : readAll()[slot];
        },

        // Change some fields of the current save and write it.
        // Pass quiet: true to skip the "Saved ✓" note.
        update: function (changes, quiet) {
            const slot = activeSlot();
            if (slot === null) return null;
            const slots = readAll();
            if (!slots[slot]) return null;
            slots[slot] = Object.assign(slots[slot], changes, { lastPlayed: Date.now() });
            writeAll(slots);
            if (!quiet) showSaved();
            return slots[slot];
        },

        // Start a brand new game in a slot (replaces what was there)
        startNew: function (slot, teacherId) {
            const slots = readAll();
            slots[slot] = upgrade({
                teacher: teacherId,
                dayId: SC.days.current.id,
                created: Date.now(),
                lastPlayed: Date.now()
            });
            writeAll(slots);
            localStorage.setItem(ACTIVE_KEY, String(slot));
            return slots[slot];
        },

        // Remember that a level was beaten (zones will unlock from this later)
        beat: function (levelId) {
            const save = SC.save.load();
            if (!save || !levelId || save.beaten.indexOf(levelId) !== -1) return;
            SC.save.update({ beaten: save.beaten.concat(levelId) }, true);
        },

        hasBeaten: function (levelId) {
            const save = SC.save.load();
            return !!(save && save.beaten.indexOf(levelId) !== -1);
        },

        // All slots (null = empty), and helpers for the saves screen
        list: function () { return readAll(); },

        firstEmpty: function () { return readAll().indexOf(null); },

        hasAny: function () {
            return readAll().some(Boolean);
        },

        use: function (slot) {
            localStorage.setItem(ACTIVE_KEY, String(slot));
        },

        remove: function (slot) {
            const slots = readAll();
            slots[slot] = null;
            writeAll(slots);
            if (activeSlot() === slot) localStorage.removeItem(ACTIVE_KEY);
        },

        // Short description of where a save is, like "Gym Class · Zone 2 of 3"
        describe: function (save) {
            if (!save) return '';
            if (save.dayComplete) return 'Day complete!';
            const day = SC.days && SC.days.current;
            if (!day) return '';
            const node = day.nodes[save.zoneNode !== null ? save.zoneNode : save.nodeIndex];
            if (!node) return 'Starting the day';
            if (node.zones && save.zoneNode !== null) {
                return node.label + ' · Zone ' + (save.zoneIndex + 1) + ' of ' + node.zones.length;
            }
            return node.label;
        },

        // "Just now", "5 min ago", "2 hours ago", "3 days ago"
        timeAgo: function (time) {
            const mins = Math.round((Date.now() - time) / 60000);
            if (mins < 1) return 'Just now';
            if (mins < 60) return mins + ' min ago';
            const hours = Math.round(mins / 60);
            if (hours < 24) return hours + (hours === 1 ? ' hour ago' : ' hours ago');
            const days = Math.round(hours / 24);
            return days + (days === 1 ? ' day ago' : ' days ago');
        }
    };
})();