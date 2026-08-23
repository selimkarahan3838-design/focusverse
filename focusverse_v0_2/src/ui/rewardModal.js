export function bindRewardModal({ modal, onSelect }) {
  modal.querySelectorAll('[data-reward]').forEach(button => {
    button.addEventListener('click', () => {
      onSelect(button.dataset.reward);
      modal.close();
    });
  });
}