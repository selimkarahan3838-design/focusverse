import { DIFFICULTIES, XP_BY_DIFFICULTY } from '../domain/tasks.js';
import { createRewardState, isRewardId, isRewardLevel, isRewardOptions } from '../domain/rewards.js';
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

function makeMigrationId(index) {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `legacy-${Date.now()}-${index}`;
}

function migrationTimestamp(task) {
  return typeof task.createdAt === 'string' && task.createdAt ? task.createdAt : new Date().toISOString();
}

function normalizeLegacyTask(task, index) {
  if (!task || typeof task !== 'object') return null;
  const title = typeof task.title === 'string' ? task.title : task.name;
  if (typeof title !== 'string' || !title.trim()) return null;
  const difficulty = DIFFICULTIES.includes(task.difficulty) ? task.difficulty : 'medium';
  const numericXp = typeof task.xp === 'number' || (typeof task.xp === 'string' && task.xp.trim())
    ? Number(task.xp)
    : NaN;
  const xp = Number.isFinite(numericXp) && numericXp >= 0
    ? numericXp
    : XP_BY_DIFFICULTY[difficulty];
  const completed = typeof task.completed === 'boolean' ? task.completed : Boolean(task.done);
  const createdAt = migrationTimestamp(task);
  return {
    id: typeof task.id === 'string' && task.id ? task.id : makeMigrationId(index),
    title: title.trim().slice(0, 100),
    difficulty,
    xp,
    completed,
    createdAt,
    completedAt: task.completedAt === null || typeof task.completedAt === 'string'
      ? task.completedAt
      : completed ? createdAt : null
  };
}

const isValidUnlockedItem = item => isRewardId(item);
const hasDuplicate = values => new Set(values).size !== values.length;
const isValidRewardRecord = reward => reward && isRewardLevel(reward.level) && isRewardId(reward.id);
const isValidAvailableReward = reward => reward && isRewardLevel(reward.level) && isRewardOptions(reward.options);
const isValidRewards = (rewards, unlockedItems = [], currentLevel = Number.POSITIVE_INFINITY) => {
  if (!rewards || !Array.isArray(rewards.available) || !Array.isArray(rewards.claimed)) return false;
  if (!rewards.available.every(isValidAvailableReward) || !rewards.claimed.every(isValidRewardRecord)) return false;
  if ([...rewards.available, ...rewards.claimed].some(reward => reward.level > currentLevel)) return false;
  if (hasDuplicate(rewards.available.map(reward => reward.level))) return false;
  if (hasDuplicate(rewards.claimed.map(reward => reward.level))) return false;
  if (rewards.available.some(available => rewards.claimed.some(claimed => claimed.level === available.level))) return false;
  return rewards.claimed.every(reward => unlockedItems.includes(reward.id));
};
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
  if (hasDuplicate(candidate.unlockedItems) || !isValidProgression(candidate.progression, candidate.tasks) || !isValidRewards(candidate.rewards, candidate.unlockedItems, candidate.progression.level)) return false;
  return true;
}

export function normalizeState(candidate) {
  if (!candidate || typeof candidate !== 'object' || !Array.isArray(candidate.tasks)) return createInitialState();
  const tasks = candidate.tasks.map(normalizeLegacyTask).filter(isValidTask);
  const totalXp = tasks.reduce((sum, task) => sum + (task.completed ? task.xp : 0), 0);
  const progression = progressionFromXp(totalXp);
  const unlockedItems = Array.isArray(candidate.unlockedItems)
    ? [...new Set(candidate.unlockedItems.filter(isValidUnlockedItem))]
    : [];
  const rewardClaims = candidate.rewards?.claimed?.filter(isValidRewardRecord).map(reward => reward.id) || [];
  const consistentUnlockedItems = [...new Set([...unlockedItems, ...rewardClaims])];
  const rewards = isValidRewards(candidate.rewards, consistentUnlockedItems, progression.level) ? candidate.rewards : createRewardState();
  return { version: CURRENT_VERSION, tasks, unlockedItems: consistentUnlockedItems, progression, rewards };
}

export function migrateLegacyState(raw) {
  if (!raw || typeof raw !== 'object') return createInitialState();
  if (raw.version === CURRENT_VERSION) return normalizeState(raw);
  if (!Array.isArray(raw.tasks)) {
    const unlockedItems = Array.isArray(raw.unlockedItems)
      ? raw.unlockedItems.filter(isValidUnlockedItem)
      : [];
    return normalizeState({ version: CURRENT_VERSION, tasks: [], unlockedItems, rewards: raw.rewards || createRewardState() });
  }

  if (raw.version === 2 || raw.version === 1) {
    const tasks = raw.tasks.map(normalizeLegacyTask).filter(Boolean);
    const unlockedItems = Array.isArray(raw.unlockedItems)
      ? raw.unlockedItems.filter(isValidUnlockedItem)
      : [];
    return normalizeState({ version: CURRENT_VERSION, tasks, unlockedItems, rewards: raw.rewards || createRewardState() });
  }

  const tasks = raw.tasks.map(normalizeLegacyTask).filter(Boolean);
  const unlockedItems = Array.isArray(raw.unlockedItems)
    ? raw.unlockedItems.filter(isValidUnlockedItem)
    : [];

  return normalizeState({ version: CURRENT_VERSION, tasks, unlockedItems, rewards: raw.rewards || createRewardState() });
}
