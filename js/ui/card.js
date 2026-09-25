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
    el.className = 'card card--' + card.type.toLowerCase();
    el.dataset.cardId = card.id;

    // Cost bubble (top-left corner)
    const cost = document.createElement('div');
    cost.className = 'card__cost';
    cost.textContent = card.cost;
    cost.setAttribute('aria-label', 'Cost ' + card.cost);

    // Art panel (left side)
    const art = document.createElement('div');
    art.className = 'card__art';
    art.textContent = card.art;
    art.setAttribute('aria-hidden', 'true');

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

    return el;
};