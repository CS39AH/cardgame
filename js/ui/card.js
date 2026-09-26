/* =========================================================
   SUBSTITUTE CHAOS — CARD RENDERER
   =========================================================
   SC.renderCard(card) takes a card object from cards.js and
   returns a finished card element ready to put on the page.

   Same function will be used for the title screen demo and
   for cards in the player's hand during combat.
   ========================================================= */

window.SC = window.SC || {};

SC.renderCard = function (card) {
    const el = document.createElement('article');
    // Rarity: cards without one count as common
    const rarity = (card.rarity || 'Common').toLowerCase();

    el.className = 'card card--' + card.type.toLowerCase() + ' card--' + rarity;
    el.dataset.cardId = card.id;

    // Cost bubble (top-left corner)
    const cost = document.createElement('div');
    cost.className = 'card__cost';
    cost.textContent = card.cost;
    cost.setAttribute('aria-label', 'Cost ' + card.cost);

       // Art panel (left side) — image if the card has one, emoji otherwise
    const art = document.createElement('div');
    art.className = 'card__art';

    if (card.image) {
        art.classList.add('card__art--image');

        const img = document.createElement('img');
        img.className = 'card__image';
        img.src = card.image;
        img.alt = card.imageAlt || card.name;
        // Optional per-card art adjustments from cards.js
        if (card.imageRotate) {
            img.style.setProperty('--art-rotate', card.imageRotate + 'deg');
        }
        if (card.imageScale) {
            img.style.setProperty('--art-scale', card.imageScale);
        }

        // If the image fails to load, fall back to the emoji
        img.addEventListener('error', function () {
            art.classList.remove('card__art--image');
            art.textContent = card.art;
        });

        art.appendChild(img);
    } else {
        art.textContent = card.art;
        art.setAttribute('aria-hidden', 'true');
    }

    // Text body (right side)
    const body = document.createElement('div');
    body.className = 'card__body';

    const name = document.createElement('h3');
    name.className = 'card__name';
    name.textContent = card.name;

    const type = document.createElement('p');
    type.className = 'card__type';
    type.textContent = card.type;

    const description = document.createElement('p');
    description.className = 'card__description';
    description.textContent = card.description;

    body.appendChild(name);
    body.appendChild(type);
    body.appendChild(description);

    el.appendChild(cost);
    el.appendChild(art);
    el.appendChild(body);

    // Star sticker for anything above common
    if (rarity !== 'common') {
        const sticker = document.createElement('div');
        sticker.className = 'card__rarity';
        sticker.textContent = '★';
        sticker.title = card.rarity;
        sticker.setAttribute('aria-label', card.rarity + ' card');
        el.appendChild(sticker);
    }

    return el;
};