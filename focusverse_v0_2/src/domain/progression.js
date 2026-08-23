export const XP_PER_LEVEL = 250;

export function progressionFromXp(xp) {
  const safeXp = Number.isFinite(xp) && xp >= 0 ? xp : 0;
  return {
    totalXp: safeXp,
    level: levelFromXp(safeXp)
  };
}

export function totalXp(tasks) {
  return tasks.reduce((sum, task) => sum + (task.completed ? task.xp : 0), 0);
}

export function completedCount(tasks) {
  return tasks.filter(task => task.completed).length;
}

export function levelFromXp(xp) {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export function progressToNextLevel(xp) {
  return xp % XP_PER_LEVEL;
}

export function planetScale(xp) {
  const level = levelFromXp(xp);
  return 1 + Math.min(level - 1, 9) * 0.08;
}

export function planetEvolution(level) {
  const evolutionLevel = Math.min(Math.max(level, 1), 10);
  return {
    saturation: 1 + (evolutionLevel - 1) * 0.08,
    glow: 0.4 + (evolutionLevel - 1) * 0.08,
    hue: (evolutionLevel - 1) * 8
  };
}

export function levelUpsBetweenXp(previousXp, currentXp) {
  const previousLevel = levelFromXp(previousXp);
  const currentLevel = levelFromXp(currentXp);
  if (currentLevel <= previousLevel) return [];
  return Array.from(
    { length: currentLevel - previousLevel },
    (_, index) => previousLevel + index + 1
  );
}
