window.SC = window.SC || {};

// Turn an enemy entry into something SC.renderCard can draw
function enemyToCard(enemy) {
  return {
    id: enemy.id,
    name: enemy.name,
    cost: 0,
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
  if (!level || !hero || !SC.updateHeroStats) {
    console.warn('Tutorial hero: missing level, hero card, or SC.updateHeroStats');
    return;
  }

  const el = SC.renderCard(hero);
  slot.innerHTML = '';
  slot.appendChild(el);

  const card = el.classList.contains('card--hero') ? el : el.querySelector('.card--hero');
  if (!card) {
    console.warn('Tutorial hero: rendered card has no .card--hero');
    return;
  }

  SC.updateHeroStats(card, {
    sanity: level.sanity,
    maxSanity: level.sanity,
    relaxation: 0,
    energy: level.energy,
    maxEnergy: level.energy
  });
}

SC.initTutorial = function (root) {
  const scope = root || document;

  scope.querySelectorAll('[data-card]').forEach(function (slot) {
    const id = slot.dataset.card;
    let card = SC.getCard(id);

    if (!card && SC.enemies && SC.enemies[id]) {
      card = enemyToCard(SC.enemies[id]);
    }
    if (!card) {
      console.warn('Unknown card id:', id);
      return;
    }

    slot.innerHTML = '';
    slot.appendChild(SC.renderCard(card));
  });

  scope.querySelectorAll('[data-level-stats]').forEach(buildTutorialHero);
};