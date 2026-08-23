export function bindEvents({ input, difficultySelect, addButton, resetButton, mentorButton, onAdd, onReset, onMentor }) {
  const submit = () => {
    onAdd(input.value, difficultySelect.value);
    input.value = '';
  };

  addButton.addEventListener('click', submit);
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter') submit();
  });
  resetButton.addEventListener('click', onReset);
  mentorButton.addEventListener('click', onMentor);
}
