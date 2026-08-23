import { DIFFICULTIES } from '../domain/tasks.js';
import { createRewardState, isRewardId } from '../domain/rewards.js';
import { progressionFromXp } from '../domain/progression.js';

export const CURRENT_VERSION = 3;

export const createInitialState = () => ({
  version: CURRENT_VERSION,
  tasks: [],
  unlockedItems: [],
  progression: { totalXp: 0, level: 1 },
  rewards: createRewardState()
});

const isValidTask = (task) => (
  task &&
  typeof task.id === 'string' &&
  typeof task.title === 'string' &&
  DIFFICULTIES.includes(task.difficulty) &&
  typeof task.xp === 'number' && Number.isFinite(task.xp) && task.xp >= 0 &&
  typeof task.completed === 'boolean' &&
  typeof task.createdAt === 'string' &&
  (task.completedAt === null || typeof task.completedAt === 'string')
);

const isValidUnlockedItem = item => isRewardId(item);
const isValidRewardRecord = reward => reward && Number.isInteger(reward.level) && reward.level >= 0 && isRewardId(reward.id);
const isValidAvailableReward = reward => isValidRewardRecord(reward) && Array.isArray(reward.options) && reward.options.every(isRewardId);
const isValidRewards = rewards => rewards && Array.isArray(rewards.available) && Array.isArray(rewards.claimed) && rewards.available.every(isValidAvailableReward) && rewards.claimed.every(isValidRewardRecord);
const isValidProgression = (progression, tasks) => {
  if (!progression || !Number.isFinite(progression.totalXp) || progression.totalXp < 0 || !Number.isInteger(progression.level) || progression.level < 1) return false;
  const expected = progressionFromXp(tasks.reduce((sum, task) => sum + (task.completed ? task.xp : 0), 0));
  return progression.totalXp === expected.totalXp && progression.level === expected.level;
};

export function validateState(candidate) {
  if (!candidate || typeof candidate !== 'object') return false;
  if (candidate.version !== CURRENT_VERSION) return false;
  if (!Array.isArray(candidate.tasks)) return false;
  if (!Array.isArray(candidate.unlockedItems)) return false;
  if (!candidate.tasks.every(isValidTask) || !candidate.unlockedItems.every(isValidUnlockedItem)) return false;
  if (!isValidProgression(candidate.progression, candidate.tasks) || !isValidRewards(candidate.rewards)) return false;
  return true;
}

export function normalizeState(candidate) {
  if (!candidate || typeof candidate !== 'object' || !Array.isArray(candidate.tasks)) return createInitialState();
  const tasks = candidate.tasks.filter(isValidTask);
  const totalXp = tasks.reduce((sum, task) => sum + (task.completed ? task.xp : 0), 0);
  const progression = progressionFromXp(totalXp);
  const unlockedItems = Array.isArray(candidate.unlockedItems) ? candidate.unlockedItems.filter(isValidUnlockedItem) : [];
  const rewards = isValidRewards(candidate.rewards) ? candidate.rewards : createRewardState();
  return { version: CURRENT_VERSION, tasks, unlockedItems, progression, rewards };
}

export function migrateLegacyState(raw) {
  if (!raw || typeof raw !== 'object') return createInitialState();
  if (raw.version === CURRENT_VERSION) return normalizeState(raw);
  if (!Array.isArray(raw.tasks)) return createInitialState();

  if (raw.version === 2 || raw.version === 1) {
    const tasks = raw.tasks
      .filter(task => task && typeof task.id === 'string' && typeof task.title === 'string')
      .map(task => ({ ...task, difficulty: DIFFICULTIES.includes(task.difficulty) ? task.difficulty : 'medium' }))
      .filter(isValidTask);
    const unlockedItems = Array.isArray(raw.unlockedItems)
      ? raw.unlockedItems.filter(isValidUnlockedItem)
      : [];
    return normalizeState({ version: CURRENT_VERSION, tasks, unlockedItems, rewards: createRewardState() });
  }

  const tasks = raw.tasks
    .filter(t => t && typeof t.name === 'string')
    .map((t, i) => ({
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `legacy-${Date.now()}-${i}`,
      title: t.name.trim().slice(0, 100),
      xp: Number.isFinite(Number(t.xp)) ? Math.max(0, Math.round(Number(t.xp))) : 50,
      difficulty: 'medium',
      completed: Boolean(t.done),
      createdAt: new Date().toISOString(),
      completedAt: t.done ? new Date().toISOString() : null
    }));

  return normalizeState({ version: CURRENT_VERSION, tasks, unlockedItems: [], rewards: createRewardState() });
}
