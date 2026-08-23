function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const XP_BY_DIFFICULTY = Object.freeze({
  easy: 25,
  medium: 50,
  hard: 100
});

export const DIFFICULTIES = Object.freeze(Object.keys(XP_BY_DIFFICULTY));

function normalizeDifficulty(difficulty) {
  return typeof difficulty === 'string' && Object.hasOwn(XP_BY_DIFFICULTY, difficulty)
    ? difficulty
    : 'medium';
}

export function createTask(title, difficulty = 'medium') {
  if (typeof title !== 'string') return null;
  const cleanTitle = title.trim().slice(0, 100);
  if (!cleanTitle) return null;
  const selectedDifficulty = normalizeDifficulty(difficulty);
  return {
    id: makeId(),
    title: cleanTitle,
    difficulty: selectedDifficulty,
    xp: XP_BY_DIFFICULTY[selectedDifficulty],
    completed: false,
    createdAt: new Date().toISOString(),
    completedAt: null
  };
}

export function addTask(state, task) {
  return { ...state, tasks: [task, ...state.tasks] };
}

export function completeTask(state, id) {
  const tasks = state.tasks.map(task => task.id === id && !task.completed
    ? { ...task, completed: true, completedAt: new Date().toISOString() }
    : task
  );
  return { ...state, tasks };
}
