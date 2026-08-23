export const REWARD_IDS = Object.freeze(['nature', 'energy', 'satellite']);

export const REWARD_OPTIONS = Object.freeze(REWARD_IDS.map(id => id));

const isRewardId = id => typeof id === 'string' && REWARD_IDS.includes(id);
const isRewardLevel = level => Number.isInteger(level) && level >= 2;
const hasDuplicateIds = ids => new Set(ids).size !== ids.length;
const isRewardOptions = options => Array.isArray(options) && options.length > 0 && options.every(isRewardId) && !hasDuplicateIds(options);

export function createRewardState() {
  return { available: [], claimed: [] };
}

export function unlockRewards(rewardState, levels) {
  const current = rewardState || createRewardState();
  const available = [...current.available];
  levels.forEach(level => {
    if (!isRewardLevel(level)) return;
    if (current.claimed.some(reward => reward.level === level)) return;
    if (available.some(reward => reward.level === level)) return;
    available.push({ level, options: [...REWARD_OPTIONS] });
  });
  return { ...current, available };
}

export function claimReward(rewardState, level, id) {
  const current = rewardState || createRewardState();
  if (!isRewardLevel(level) || !isRewardId(id)) return null;
  if (current.claimed.some(reward => reward.level === level && reward.id === id)) return null;
  const reward = current.available.find(item => item.level === level && item.options.includes(id));
  if (!reward) return null;
  return {
    available: current.available.filter(item => item !== reward),
    claimed: [...current.claimed, { level, id }]
  };
}

export function rewardStateFromLegacy(unlockedItems) {
  return { available: [], claimed: [] };
}

export { isRewardId, isRewardLevel, isRewardOptions };