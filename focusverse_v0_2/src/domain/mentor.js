import { XP_PER_LEVEL } from './progression.js';

export function getMentorMessage(state) {
  const pending = state.tasks.some(task => !task.completed);
  const xp = state.tasks.reduce((sum, task) => sum + (task.completed ? task.xp : 0), 0);
  if (!state.tasks.length) return '“İlk görevi ekle. Sonra küçük bir zafer kazan.”';
  if (pending) return xp >= XP_PER_LEVEL ? '“İlk bölge açılmaya hazır. Bekleyen en küçük görevi seç.”' : '“En küçük bekleyen görevi seç. Sadece 10 dakikalık bir başlangıç yap.”';
  return '“Bugünlük görev kalmadı. Yeni bir hedef seç ve küçük bir ilk adım belir.”';
}
