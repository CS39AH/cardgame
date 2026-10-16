/* =========================================================
   TUTORIAL (How to Play page)
   Only draws the example cards and hero stats on the page.
   The practice fight is NOT started here: the "Take me there"
   link opens #battle, and js/ui/battle.js starts the fight.
   ========================================================= */

window.SC = window.SC || {};

function hasOwn(obj, key) {
  return !!obj && Object.prototype.hasOwnProperty.call(obj, key);
}

// Turn an enemy entry into something SC.renderCard can draw
function enemyToCard(enemy) {
  return {
    id: enemy.id,
    name: enemy.name,
    cost: 0, // if a "0" cost badge shows on enemy cards, change this to null
    type: 'Enemy',
    art: enemy.art,
    image: enemy.image,
    imageAlt: enemy.name,
    imageScale: enemy.imageScale || 1.1,
    description: 'Sanity: ' + enemy.sanity + '. Deplete it to win!',
    demo: true,
    badgeText: 'Student · ' + enemy.name,
    badgeColor: '#d1495b',
    effects: []
  };
}

// The real in-battle hero card, using the numbers from levels.js
function buildTutorialHero(slot) {
  const level = SC.levels && SC.levels[slot.dataset.levelStats];
  const hero = SC.getCard(slot.dataset.hero);
  if (!level || !hero) {
    console.warn('Tutorial hero: missing level or hero card', {
      levelKey: slot.dataset.levelStats,
      heroId: slot.dataset.hero
    });
    return;
  }

  // Render the card first so it still shows even if stats can't be applied
  const el = SC.renderCard(hero);
  slot.innerHTML = '';
  slot.appendChild(el);

  // SC.updateHeroStats is defined in js/ui/battle.js
  if (typeof SC.updateHeroStats !== 'function') {
    console.warn('Tutorial hero: SC.updateHeroStats is missing (is battle.js loaded?), showing card without level stats');
    return;
  }

  const card = el.classList.contains('card--hero') ? el : el.querySelector('.card--hero');
  if (!card) {
    console.warn('Tutorial hero: rendered card has no .card--hero');
    return;
  }

  // Same rule as combat.start in js/engine/combat.js:
  // the hero card's own numbers win, levels.js is only the fallback
  const sanity = hero.startingSanity != null ? hero.startingSanity : level.sanity;
  const energy = hero.startingEnergy != null ? hero.startingEnergy : level.energy;

  SC.updateHeroStats(card, {
    sanity: sanity,
    maxSanity: sanity,
    relaxation: 0,
    energy: energy,
    maxEnergy: energy
  });
}

// Render every [data-card] slot (cards and enemies)
function renderTutorialCards(scope) {
  scope.querySelectorAll('[data-card]').forEach(function (slot) {
    try {
      const id = slot.dataset.card;
      let card = SC.getCard(id);

      if (!card && hasOwn(SC.enemies, id)) {
        card = enemyToCard(SC.enemies[id]);
      }
      if (!card) {
        console.warn('Unknown card id:', id);
        return;
      }

      slot.innerHTML = '';
      slot.appendChild(SC.renderCard(card));
    } catch (err) {
      console.error('Tutorial: failed to render card "' + slot.dataset.card + '":', err);
    }
  });
}

SC.initTutorial = function (root) {
  const scope = root || document;
  renderTutorialCards(scope);
  scope.querySelectorAll('[data-level-stats]').forEach(buildTutorialHero);
};