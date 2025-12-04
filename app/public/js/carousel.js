function openPhaseModal(id) {
  document.getElementById(id).classList.add('show');
}

function closePhaseModal(id) {
  document.getElementById(id).classList.remove('show');
}

window.addEventListener('click', function (event) {
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    if (event.target === modal) {
      modal.classList.remove('show');
    }
  });
});
