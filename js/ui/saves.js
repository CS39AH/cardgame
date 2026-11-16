/*
 * SAVE SLOTS SCREEN
 * -----------------
 * Three manila folders, one per save slot (screens/saves.html).
 *
 *   SC.saveMode = 'load' -> from "Continue Your Day": load or delete a save
 *   SC.saveMode = 'new'  -> after "Clock In" with every slot full: pick one
 *                           to replace with a new game (SC.pendingTeacher)
 *
 * All the saving itself is in js/engine/save.js.
 */

window.SC = window.SC || {};

(function () {
    'use strict';

    SC.setupSaves = function () {
        const box = document.getElementById('save-slots');
        if (!box) return;

        const mode = SC.saveMode === 'new' && SC.pendingTeacher ? 'new' : 'load';

        document.getElementById('saves-title').textContent =
            mode === 'new' ? 'All Save Files Are Full' : 'Save Files';
        document.getElementById('saves-subtitle').textContent =
            mode === 'new'
                ? 'Pick a save to replace with your new game.'
                : 'Pick up where you left off.';

        function render() {
            box.innerHTML = '';
            SC.save.list().forEach(function (save, slot) {
                box.appendChild(buildSlot(save, slot));
            });
        }

        function buildSlot(save, slot) {
            const folder = document.createElement('div');
            folder.className = 'save-slot' + (save ? '' : ' save-slot--empty');
            folder.style.setProperty('--slot', slot);

            const tab = '<div class="save-slot__tab">Save ' + (slot + 1) + '</div>';

            if (!save) {
                folder.innerHTML = tab +
                    '<div class="save-slot__page save-slot__page--empty">' +
                    '<p class="save-slot__empty">Empty</p>' +
                    (mode === 'new' ? '' : '<p class="save-slot__hint">Start a new day to use this slot.</p>') +
                    '</div>';
                return folder;
            }

            const teacher = SC.getCard(save.teacher) || {};
            const deckSize = save.playerDeck ? save.playerDeck.length
                : (teacher.startingDeck || []).length;

            folder.innerHTML = tab +
                '<div class="save-slot__page">' +
                    '<div class="save-slot__photo"><img src="' + (teacher.image || '') + '" alt=""></div>' +
                    '<h2 class="save-slot__name">' + (teacher.name || 'Teacher') + '</h2>' +
                    '<p class="save-slot__where">' + SC.save.describe(save) + '</p>' +
                    '<dl class="save-slot__facts">' +
                        '<div><dt>Deck</dt><dd>' + deckSize + ' cards</dd></div>' +
                        '<div><dt>Zones beaten</dt><dd>' + save.beaten.length + '</dd></div>' +
                        '<div><dt>Last played</dt><dd>' + SC.save.timeAgo(save.lastPlayed) + '</dd></div>' +
                    '</dl>' +
                    '<div class="save-slot__buttons"></div>' +
                '</div>';

            const buttons = folder.querySelector('.save-slot__buttons');

            if (mode === 'new') {
                buttons.appendChild(button('Replace', 'btn btn--primary', function () {
                    confirmIn(folder, 'Replace this save? It will be gone for good.', function () {
                        SC.save.startNew(slot, SC.pendingTeacher);
                        SC.pendingTeacher = null;
                        SC.saveMode = null;
                        if (SC.playSound) SC.playSound('bell');
                        window.location.hash = 'map';
                    });
                }));
                return folder;
            }

            if (!save.dayComplete) {
                buttons.appendChild(button('Continue', 'btn btn--primary', function () {
                    SC.save.use(slot);
                    if (SC.playSound) SC.playSound('bell');
                    // Inside a location's zones: go straight back to them
                    if (save.zoneNode !== null && save.zoneNode !== undefined) {
                        SC.currentLocation = { nodeIndex: save.zoneNode };
                        window.location.hash = 'zones';
                    } else {
                        window.location.hash = 'map';
                    }
                }));
            }
            buttons.appendChild(button('Delete', 'btn btn--secondary save-slot__delete', function () {
                confirmIn(folder, 'Delete this save? It will be gone for good.', function () {
                    SC.save.remove(slot);
                    if (SC.playSound) SC.playSound('slam');
                    render();
                });
            }));
            return folder;
        }

        function button(text, className, onClick) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = className;
            btn.textContent = text;
            btn.addEventListener('click', onClick);
            return btn;
        }

        // A small "Are you sure?" note right on the folder
        function confirmIn(folder, message, onYes) {
            if (folder.querySelector('.save-slot__confirm')) return;
            const note = document.createElement('div');
            note.className = 'save-slot__confirm';
            note.innerHTML = '<p>' + message + '</p>';
            note.appendChild(button('Yes', 'btn btn--primary', onYes));
            note.appendChild(button('Cancel', 'btn btn--secondary', function () { note.remove(); }));
            folder.querySelector('.save-slot__page').appendChild(note);
            if (SC.playSound) SC.playSound('chalkClick');
        }

        render();
        if (SC.playSound) SC.playSound('clipboard');
    };
})();