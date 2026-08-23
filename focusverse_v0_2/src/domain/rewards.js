export const REWARD_IDS = Object.freeze(['nature', 'energy', 'satellite']);

export const REWARD_OPTIONS = Object.freeze(REWARD_IDS.map(id => id));

const isRewardId = id => typeof id === 'string' && REWARD_IDS.includes(id);

export function createRewardState() {
  return { available: [], claimed: [] };
}

export function unlockRewards(rewardState, levels) {
  const current = rewardState || createRewardState();
  const available = [...current.available];
  levels.forEach(level => {
    if (!Number.isInteger(level) || level < 2) return;
    if (available.some(reward => reward.level === level)) return;
    available.push({ level, options: [...REWARD_OPTIONS] });
  });
  return { ...current, available };
}

export function claimReward(rewardState, level, id) {
  const current = rewardState || createRewardState();
  if (!isRewardId(id)) return null;
  const reward = current.available.find(item => item.level === level && item.options.includes(id));
  if (!reward) return null;
  return {
    available: current.available.filter(item => item !== reward),
    claimed: [...current.claimed, { level, id }]
  };
}

export function rewardStateFromLegacy(unlockedItems) {
  const claimed = Array.isArray(unlockedItems)
    ? unlockedItems.filter(isRewardId).map(id => ({ level: 0, id }))
    : [];
  return { available: [], claimed };
}

export { isRewardId };