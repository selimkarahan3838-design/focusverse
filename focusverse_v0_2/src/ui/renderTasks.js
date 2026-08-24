export function renderTasks(state, container, onComplete, onDelete, onEdit, onSaveEdit, onCancelEdit, onReactivate, editingTaskId) {
  container.replaceChildren();
  if (!state.tasks.length) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'Henüz görev yok. İlk görevin evrenin başlangıç noktası.';
    container.appendChild(empty);
    return;
  }

  const difficultyLabels = { easy: 'Kolay', medium: 'Orta', hard: 'Zor' };

  state.tasks.forEach((task, index) => {
    const row = document.createElement('div');
    row.className = `task${task.completed ? ' done' : ''}`;

    const info = document.createElement('div');
    if (editingTaskId === task.id) {
      const editor = document.createElement('div');
      editor.className = 'task-edit';

      const titleInput = document.createElement('input');
      titleInput.type = 'text';
      titleInput.value = task.title;
      titleInput.className = 'task-edit-title';
      titleInput.setAttribute('aria-label', 'Görev başlığını düzenle');

      const difficultySelect = document.createElement('select');
      difficultySelect.className = 'task-edit-difficulty';
      Object.keys(difficultyLabels).forEach((difficulty) => {
        const option = document.createElement('option');
        option.value = difficulty;
        option.textContent = difficultyLabels[difficulty];
        option.selected = task.difficulty === difficulty;
        difficultySelect.appendChild(option);
      });

      const editActions = document.createElement('div');
      editActions.className = 'task-edit-actions';

      const save = document.createElement('button');
      save.type = 'button';
      save.className = 'task-action primary';
      save.textContent = 'Kaydet';
      save.addEventListener('click', () => onSaveEdit(task.id, titleInput.value, difficultySelect.value));

      const cancel = document.createElement('button');
      cancel.type = 'button';
      cancel.className = 'task-action secondary';
      cancel.textContent = 'İptal';
      cancel.addEventListener('click', () => onCancelEdit());

      titleInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') onSaveEdit(task.id, titleInput.value, difficultySelect.value);
        if (event.key === 'Escape') onCancelEdit();
      });

      editActions.append(save, cancel);
      editor.append(titleInput, difficultySelect, editActions);
      info.appendChild(editor);
    } else {
      const name = document.createElement('div');
      name.className = 'name';
      name.textContent = task.title;
      const meta = document.createElement('div');
      meta.className = 'meta';
      meta.textContent = `Görev #${index + 1} · ${task.completed ? 'Tamamlandı' : 'Bekliyor'}`;
      info.append(name, meta);
    }

    const actions = document.createElement('div');
    actions.className = 'task-actions';

    if (editingTaskId !== task.id) {
      const xp = document.createElement('span');
      xp.className = 'xp';
      xp.textContent = `+${task.xp} XP`;
      const difficulty = document.createElement('span');
      difficulty.className = 'difficulty';
      difficulty.textContent = difficultyLabels[task.difficulty] || 'Orta';
      actions.append(difficulty, xp);

      if (!task.completed) {
        const complete = document.createElement('button');
        complete.className = 'task-action primary';
        complete.type = 'button';
        complete.textContent = 'Tamamla';
        complete.addEventListener('click', () => onComplete(task.id));
        actions.appendChild(complete);
      } else {
        const reactivate = document.createElement('button');
        reactivate.className = 'task-action secondary';
        reactivate.type = 'button';
        reactivate.textContent = 'Tekrar Etkinleştir';
        reactivate.addEventListener('click', () => onReactivate(task.id));
        actions.appendChild(reactivate);
      }

      const edit = document.createElement('button');
      edit.className = 'task-action secondary';
      edit.type = 'button';
      edit.textContent = 'Düzenle';
      edit.addEventListener('click', () => onEdit(task.id));
      actions.appendChild(edit);

      const remove = document.createElement('button');
      remove.className = 'task-action danger';
      remove.type = 'button';
      remove.textContent = 'Sil';
      remove.addEventListener('click', () => onDelete(task.id));
      actions.appendChild(remove);
    }

    row.append(info, actions);
    container.appendChild(row);
  });
}
