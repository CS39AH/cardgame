/*
 * DAY MAP RENDERING
 * -----------------
 * Draws the row of map nodes into the page. This file only builds the
 * HTML elements; it does not decide what happens when a node is clicked
 * (that is passed in by setupMap() in js/main.js).
 *
 * SC.buildDayPath(container, day, currentIndex, onAdvance)
 *   container    - the <ol> element to fill with nodes (#day-path)
 *   day          - one day object from SC.days (see js/content/days.js)
 *   currentIndex - how many nodes the player has finished (0 = none yet)
 *   onAdvance    - function called as onAdvance(node, index) when the
 *                  player clicks the currently available node
 *
 * Each node is in one of three states, based on currentIndex:
 *   complete - already finished (index is before currentIndex)
 *   current  - the next node to play; the only clickable one
 *   locked   - not reachable yet (index is after currentIndex)
 */

window.SC = window.SC || {};

SC.buildDayPath = function (container, day, currentIndex, onAdvance) {
    // Clear any previous nodes so this function can safely be called again
    // to refresh the map after progress changes.
    container.innerHTML = '';

    // When every node is done, add a class so the CSS can show "Day complete!"
    container.classList.toggle('day-path--complete', currentIndex >= day.nodes.length);

    day.nodes.forEach(function (node, index) {
        // Work out this node's state from the player's progress
        let state = 'locked';
        if (index < currentIndex) state = 'complete';
        else if (index === currentIndex) state = 'current';

        // <li> wrapper. The classes drive all the styling:
        //   day-node--<state> (complete/current/locked) and day-node--<type> (combat/boss/...)
        const li = document.createElement('li');
        li.className = 'day-node day-node--' + state + ' day-node--' + node.type;

            // Place the node over its station on the map artwork.
        // node.pos = { x, y } are percentages of the map image's width/height.
        if (node.pos) {
            li.style.left = node.pos.x + '%';
            li.style.top = node.pos.y + '%';
        }

        // The clickable button. Only the "current" node is enabled.
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'day-node__button';
        btn.disabled = state !== 'current';

        // Screen readers announce the state, e.g. "Gym Class (locked)"
        const stateLabel = state === 'locked' ? ' (locked)' : state === 'complete' ? ' (completed)' : '';
        btn.setAttribute('aria-label', node.label + stateLabel);

        // Emoji icon
        const icon = document.createElement('span');
        icon.className = 'day-node__icon';
        icon.textContent = node.icon;

        // Text label under the icon
        const label = document.createElement('span');
        label.className = 'day-node__label';
        label.textContent = node.label;

        btn.appendChild(icon);
        btn.appendChild(label);
        li.appendChild(btn);
        container.appendChild(li);

        // Only the current node reacts to clicks. { once: true } prevents
        // double-clicking from advancing the player two nodes at once.
        if (state === 'current') {
            btn.addEventListener('click', function () {
                onAdvance(node, index);
            }, { once: true });
        }
    });
};