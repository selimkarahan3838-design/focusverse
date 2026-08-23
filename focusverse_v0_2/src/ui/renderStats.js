import { completedCount, levelFromXp, planetEvolution, planetScale, progressToNextLevel, XP_PER_LEVEL, totalXp } from '../domain/progression.js';

const PLANET_ITEMS = {
  nature: { icon: '🌱', label: 'Doğa Bölgesi' },
  energy: { icon: '⚡', label: 'Enerji Santrali' },
  satellite: { icon: '🛰️', label: 'Yörünge Uydusu' }
};

export function renderStats(state, elements) {
  const xp = totalXp(state.tasks);
  const completed = completedCount(state.tasks);
  const level = levelFromXp(xp);
  const progress = progressToNextLevel(xp);

  elements.xp.textContent = xp;
  elements.level.textContent = level;
  elements.done.textContent = completed;
  const evolution = planetEvolution(level);
  elements.planet.style.transform = `scale(${planetScale(xp)})`;
  elements.planet.style.filter = `saturate(${evolution.saturation}) hue-rotate(${evolution.hue}deg)`;
  elements.planet.style.boxShadow = `0 0 ${50 + (level - 1) * 8}px rgba(124, 92, 255, ${evolution.glow})`;
  elements.planetItems.replaceChildren();
  (state.unlockedItems || []).forEach((item, index) => {
    const itemData = PLANET_ITEMS[item];
    if (!itemData) return;
    const itemElement = document.createElement('span');
    itemElement.className = 'planet-item';
    itemElement.style.setProperty('--item-index', String(index));
    itemElement.textContent = itemData.icon;
    itemElement.setAttribute('aria-label', itemData.label);
    elements.planetItems.appendChild(itemElement);
  });
  elements.fill.style.width = `${(progress / XP_PER_LEVEL) * 100}%`;
  elements.progressText.textContent = `${progress} / ${XP_PER_LEVEL} XP`;
  elements.progressBar.setAttribute('aria-valuenow', String(progress));

}
