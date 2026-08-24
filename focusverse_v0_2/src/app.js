import { createTask, addTask, completeTask, removeTask, updateTask, reactivateTask } from './domain/tasks.js';
import { getMentorMessage } from './domain/mentor.js';
import { createStore } from './state/store.js';
import { clearState } from './services/storage.js';
import { renderStats } from './ui/renderStats.js';
import { renderTasks } from './ui/renderTasks.js';
import { bindEvents } from './ui/events.js';
import { bindRewardModal } from './ui/rewardModal.js';
import { claimReward, unlockRewards } from './domain/rewards.js';
import { progressionFromXp, progressionTransition, totalXp } from './domain/progression.js';

const elements = {
  xp: document.getElementById('xp'),
  level: document.getElementById('level'),
  done: document.getElementById('done'),
  planet: document.getElementById('planet'),
  planetItems: document.getElementById('planet-items'),
  rewardModal: document.getElementById('reward-modal'),
  rewardLevel: document.querySelector('[data-reward-level]'),
  levelUpNotification: document.getElementById('level-up-notification'),
  fill: document.getElementById('fill'),
  progressText: document.getElementById('progressText'),
  progressBar: document.querySelector('[role="progressbar"]'),
  tasks: document.getElementById('tasks'),
  mentor: document.getElementById('mentor'),
  taskInput: document.getElementById('taskInput'),
  taskDifficulty: document.getElementById('task-difficulty'),
  add: document.getElementById('add'),
  reset: document.getElementById('reset'),
  mentorButton: document.getElementById('mentorBtn')
};

let activeRewardLevel = null;
let notificationTimeout;
let editingTaskId = null;

function showNotification(message) {
  elements.levelUpNotification.textContent = message;
  elements.levelUpNotification.classList.add('visible');
  clearTimeout(notificationTimeout);
  notificationTimeout = setTimeout(() => elements.levelUpNotification.classList.remove('visible'), 4500);
}

function applyTaskLifecycleGuard(current, nextState, message) {
  const nextProgression = progressionFromXp(totalXp(nextState.tasks));
  if (nextProgression.level < current.progression.level) {
    showNotification(message);
    return null;
  }
  return { ...nextState, progression: nextProgression };
}

const store = createStore({
  onStorageError(error) {
    showNotification('İlerleme kaydedilemedi. Tarayıcı depolama alanını kontrol et.');
    console.error(error);
  }
});

function showNextReward() {
  const pending = store.getState().rewards.available[0];
  if (!pending) return;
  activeRewardLevel = pending.level;
  elements.rewardLevel.textContent = pending.level;
  if (!elements.rewardModal.open) elements.rewardModal.showModal();
}

bindRewardModal({
  modal: elements.rewardModal,
  onSelect(item) {
    const current = store.getState();
    const rewards = claimReward(current.rewards, activeRewardLevel, item);
    if (!rewards) return;
    store.setState({
      ...current,
      rewards,
      unlockedItems: current.unlockedItems.includes(item)
        ? current.unlockedItems
        : [...current.unlockedItems, item]
    });
    setTimeout(showNextReward, 0);
  }
});

function completeTaskAndUpdate(id) {
  const current = store.getState();
  const next = completeTask(current, id);
  const nextProgression = progressionFromXp(totalXp(next.tasks));
  const transition = progressionTransition(current.progression, nextProgression);
  store.setState({ ...next, progression: nextProgression, rewards: unlockRewards(current.rewards, transition.levels) });
  if (transition.leveledUp) {
    showNotification(`Tebrikler! Seviye ${transition.newLevel}'e Ulaştın ve Gezegenin Büyüdü!`);
    showNextReward();
  }
}

function deleteTaskAndUpdate(id) {
  const current = store.getState();
  const next = removeTask(current, id);
  if (next === current) return;
  const guarded = applyTaskLifecycleGuard(
    current,
    next,
    'Mevcut seviye düşeceği için görev silinemedi.'
  );
  if (!guarded) return;
  store.setState(guarded);
}

function reactivateTaskAndUpdate(id) {
  const current = store.getState();
  const next = reactivateTask(current, id);
  if (next === current) return;
  const guarded = applyTaskLifecycleGuard(
    current,
    next,
    'Mevcut seviye düşeceği için görev tekrar etkinleştirilemedi.'
  );
  if (!guarded) return;
  store.setState(guarded);
}

function editTaskStart(id) {
  editingTaskId = id;
  render(store.getState());
}

function editTaskCancel() {
  editingTaskId = null;
  render(store.getState());
}

function editTaskSave(id, title, difficulty) {
  const current = store.getState();
  const cleanTitle = typeof title === 'string' ? title.trim() : '';
  if (!cleanTitle) {
    showNotification('Görev başlığı boş olamaz.');
    return;
  }

  const next = updateTask(current, id, { title: cleanTitle, difficulty });
  if (next === current) {
    editingTaskId = null;
    render(current);
    return;
  }

  const guarded = applyTaskLifecycleGuard(
    current,
    next,
    'Düzenleme işlemi mevcut seviye düşürmeyeceği için uygulanamadı.'
  );
  if (!guarded) return;

  editingTaskId = null;
  store.setState(guarded);
}

function render(state) {
  renderStats(state, elements);
  renderTasks(
    state,
    elements.tasks,
    completeTaskAndUpdate,
    deleteTaskAndUpdate,
    editTaskStart,
    editTaskSave,
    editTaskCancel,
    reactivateTaskAndUpdate,
    editingTaskId
  );
  elements.mentor.textContent = getMentorMessage(state);
}

bindEvents({
  input: elements.taskInput,
  difficultySelect: elements.taskDifficulty,
  addButton: elements.add,
  resetButton: elements.reset,
  mentorButton: elements.mentorButton,
  onAdd(title, difficulty) {
    const task = createTask(title, difficulty);
    if (!task) return;
    store.setState(current => addTask(current, task));
  },
  onReset() {
    clearState();
    window.location.reload();
  },
  onMentor() {
    elements.mentor.textContent = getMentorMessage(store.getState());
  }
});

store.subscribe(render);
render(store.getState());
showNextReward();
