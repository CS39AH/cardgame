/*
 * ZONE MAP RENDERING
 * ------------------
 * Draws the mini-map inside one location: the location's picture
 * (like the Gym's clipboard), a marker for each zone, and dotted
 * "play arrows" between them, like a coach's diagram.
 * Like map.js, this only builds the page. What happens on a click
 * is passed in by setupZones() in js/main.js.
 *
 * SC.buildZoneMap(container, location, currentZone, onPlay)
 *   container   - the element to fill (#zone-map)
 *   location    - one node from SC.days with a `zones` list (js/content/days.js)
 *   currentZone - how many zones the player has finished here (0 = none yet)
 *   onPlay      - called as onPlay(zone, index) when a playable zone is clicked
 *
 * Each zone:
 *   { id, label, mark, type, pos: { x, y } }
 *     id    - the level to play (in js/content/levels.js)
 *     mark  - what's drawn on the court: 'O', 'X' (a boss gets a circled X)
 *     type  - 'combat' or 'boss'
 *     pos   - where it sits, as % of the picture's width/height
 */

window.SC = window.SC || {};

SC.buildZoneMap = function (container, location, currentZone, onPlay) {
    container.innerHTML = '';
    container.classList.toggle('zone-map--cafeteria', location.id === 'cafeteria');

    // The location's picture. The markers sit on top of it, placed in %,
    // so they stay in the right spot at any size.
    const art = document.createElement('img');
    art.className = 'zone-map__art';
    art.src = location.zoneMap;
    art.alt = location.label + ' map';
    container.appendChild(art);

    // Dotted play arrows from each zone to the next. They're drawn once the
    // picture has loaded, so they know its real shape (and arrowheads
    // point the right way instead of getting stretched).
    function addPlays() {
        const aspect = art.naturalWidth && art.naturalHeight
            ? art.naturalWidth / art.naturalHeight
            : 4 / 3;
        const old = container.querySelector('.zone-map__plays');
        if (old) old.remove();
        container.insertBefore(drawPlays(location.zones, currentZone, aspect), art.nextSibling);
    }
    if (location.showZonePaths !== false) {
        if (art.complete) addPlays();
        else art.addEventListener('load', addPlays);
    }

    location.zones.forEach(function (zone, index) {
        // Same states as the day map
        let state = 'locked';
        if (index < currentZone) state = 'complete';
        else if (index === currentZone) state = 'current';
        if (SC.UNLOCK_ALL_NODES && state === 'locked') state = 'open';
        // Planned encounters stay visible but cannot start until their levels exist.
        if (zone.pending && state !== 'complete') state = 'pending';
        const playable = !zone.pending && (state === 'current' || SC.UNLOCK_ALL_NODES);

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'zone-node zone-node--' + state + ' zone-node--' + zone.type;
        btn.style.left = zone.pos.x + '%';
        btn.style.top = zone.pos.y + '%';
        btn.disabled = !playable;

        const stateLabel = state === 'pending' ? ' (coming soon)' : state === 'locked' ? ' (locked)' : state === 'complete' ? ' (completed)' : '';
        btn.setAttribute('aria-label', zone.label + stateLabel);

        // The big marker letter, drawn like a coach's marker
        const mark = document.createElement('span');
        mark.className = 'zone-node__mark zone-node__mark--' + (zone.mark === 'X' ? 'x' : 'o');
        mark.textContent = zone.mark || 'O';
        btn.appendChild(mark);

        // Finished zones get a green check over the marker
        if (state === 'complete') {
            const check = document.createElement('span');
            check.className = 'zone-node__check';
            check.textContent = '✔';
            btn.appendChild(check);
        }

        const label = document.createElement('span');
        label.className = 'zone-node__label';
        label.textContent = zone.label;
        btn.appendChild(label);

        if (state === 'pending') {
            const tag = document.createElement('span');
            tag.className = 'zone-node__boss';
            tag.textContent = 'Coming soon';
            btn.appendChild(tag);
        } else if (zone.type === 'boss') {
            const tag = document.createElement('span');
            tag.className = 'zone-node__boss';
            tag.textContent = 'Boss';
            btn.appendChild(tag);
        }

        if (playable) {
            btn.addEventListener('click', function () {
                if (SC.playSound) SC.playSound('chalkClick');
                onPlay(zone, index);
            }, { once: true });
        }

        container.appendChild(btn);
    });

    // A curved dotted line with an arrowhead between each pair of zones.
    // The SVG is 100 wide and as tall as the picture's shape (so it isn't
    // stretched), and the zone positions (in %) are turned into that space.
    function drawPlays(zones, done, aspect) {
        const NS = 'http://www.w3.org/2000/svg';
        const H = 100 / aspect;                  // height of the drawing space
        const svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('class', 'zone-map__plays');
        svg.setAttribute('viewBox', '0 0 100 ' + H);
        svg.setAttribute('preserveAspectRatio', 'none');

        const point = function (pos) {
            return { x: pos.x, y: pos.y * H / 100 };
        };

        for (let i = 0; i < zones.length - 1; i++) {
            const a = point(zones[i].pos);
            const b = point(zones[i + 1].pos);
            const cls = i < done ? ' zone-map__play--done' : '';

            // Start and stop a bit away from the markers, a little above center
            const GAP = 6.5;
            const start = { x: a.x + GAP, y: a.y - 2 };
            const end = { x: b.x - GAP, y: b.y - 2 };

            // Bend the line upward, like a hand-drawn play
            const ctrl = { x: (start.x + end.x) / 2, y: Math.min(start.y, end.y) - 12 };

            const path = document.createElementNS(NS, 'path');
            path.setAttribute('d', 'M ' + start.x + ' ' + start.y +
                ' Q ' + ctrl.x + ' ' + ctrl.y + ' ' + end.x + ' ' + end.y);
            path.setAttribute('class', 'zone-map__play' + cls);
            path.setAttribute('vector-effect', 'non-scaling-stroke');
            svg.appendChild(path);

            // Arrowhead pointing along the curve: the line arrives at `end`
            // coming from the control point, so aim it that way
            const angle = Math.atan2(end.y - ctrl.y, end.x - ctrl.x);
            const SIZE = 2.8;
            const SPREAD = 0.5;                  // how wide the arrowhead opens (radians)
            const left = {
                x: end.x - SIZE * Math.cos(angle - SPREAD),
                y: end.y - SIZE * Math.sin(angle - SPREAD)
            };
            const right = {
                x: end.x - SIZE * Math.cos(angle + SPREAD),
                y: end.y - SIZE * Math.sin(angle + SPREAD)
            };
            const head = document.createElementNS(NS, 'path');
            head.setAttribute('d', 'M ' + left.x + ' ' + left.y + ' L ' + end.x + ' ' + end.y +
                ' L ' + right.x + ' ' + right.y);
            head.setAttribute('class', 'zone-map__arrowhead' + cls);
            head.setAttribute('vector-effect', 'non-scaling-stroke');
            svg.appendChild(head);
        }
        return svg;
    }
};