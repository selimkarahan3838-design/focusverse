export function renderTasks(state, container, onComplete) {
  container.replaceChildren();
  if (!state.tasks.length) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'Henüz görev yok. İlk görevin evrenin başlangıç noktası.';
    container.appendChild(empty);
    return;
  }

  state.tasks.forEach((task, index) => {
    const row = document.createElement('div');
    row.className = `task${task.completed ? ' done' : ''}`;

    const info = document.createElement('div');
    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = task.title;
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = `Görev #${index + 1} · ${task.completed ? 'Tamamlandı' : 'Bekliyor'}`;
    info.append(name, meta);

    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.alignItems = 'center';
    actions.style.gap = '12px';
    const xp = document.createElement('span');
    xp.className = 'xp';
    xp.textContent = `+${task.xp} XP`;
    const difficultyLabels = { easy: 'Kolay', medium: 'Orta', hard: 'Zor' };
    const difficulty = document.createElement('span');
    difficulty.className = 'difficulty';
    difficulty.textContent = difficultyLabels[task.difficulty] || 'Orta';
    actions.appendChild(difficulty);
    actions.appendChild(xp);

    if (!task.completed) {
      const button = document.createElement('button');
      button.className = 'secondary';
      button.type = 'button';
      button.textContent = 'Tamamla';
      button.addEventListener('click', () => onComplete(task.id));
      actions.appendChild(button);
    } else {
      const done = document.createElement('span');
      done.setAttribute('aria-label', 'Tamamlandı');
      done.textContent = '✓';
      actions.appendChild(done);
    }

    row.append(info, actions);
    container.appendChild(row);
  });
}
