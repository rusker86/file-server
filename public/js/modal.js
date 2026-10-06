export function openModal(modal) {
  modal.classList.remove("hidden");
}

export function closeModal(modal) {
  modal.classList.add("hidden");
}

export function isAnyModalOpen() {
  return document.querySelector(".modal:not(.hidden)") !== null;
}

// Closes the modal with its close buttons or by clicking the backdrop
export function bindModalClose(modal, closeButtons, onClose) {
  closeButtons.forEach(button => button.addEventListener("click", onClose));

  modal.addEventListener("click", event => {
    if (event.target === modal) {
      onClose();
    }
  });
}
