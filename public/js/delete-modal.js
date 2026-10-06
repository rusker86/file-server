import * as api from "./api.js";
import { renderFiles } from "./files.js";
import { bindModalClose, closeModal, isAnyModalOpen, openModal } from "./modal.js";
import { getSelectedFiles, getSelectedPaths, onSelectionChange } from "./selection.js";
import { displayName, isDirectory } from "./state.js";
import { showToast } from "./toast.js";

const deleteButton = document.querySelector("#delete");
const deleteModal = document.querySelector("#delete-modal");
const deleteMessage = document.querySelector("#delete-message");
const deleteList = document.querySelector("#delete-list");
const confirmDeleteButton = document.querySelector("#confirm-delete");

function updateDeleteButton(count) {
  deleteButton.disabled = count === 0;
  deleteButton.textContent = count > 0 ? `🗑️ Delete (${count})` : "🗑️ Delete";
}

export function openDeleteModal() {
  const files = getSelectedFiles();

  if (files.length === 0) {
    return;
  }

  deleteMessage.textContent =
    files.length === 1
      ? "This item will be permanently deleted:"
      : `These ${files.length} items will be permanently deleted:`;

  deleteList.replaceChildren(
    ...files.map(file => {
      const li = document.createElement("li");
      const name = document.createElement("span");

      name.classList.add("list-item-name");
      name.textContent = `${isDirectory(file) ? "📁" : "📄"} ${displayName(file)}`;

      li.appendChild(name);
      return li;
    })
  );

  openModal(deleteModal);
  confirmDeleteButton.focus();
}

export function closeDeleteModal() {
  closeModal(deleteModal);
}

async function deleteSelected() {
  const paths = getSelectedPaths();

  confirmDeleteButton.disabled = true;

  try {
    await api.deleteFiles(paths);

    closeDeleteModal();
    await renderFiles();

    showToast(
      paths.length === 1 ? "Item deleted." : `${paths.length} items deleted.`,
      "success"
    );
  } catch (error) {
    console.error(error);
    showToast(error.message || "An error occurred while deleting.", "error");
  } finally {
    confirmDeleteButton.disabled = false;
  }
}

export function initDeleteModal() {
  onSelectionChange(updateDeleteButton);

  deleteButton.addEventListener("click", openDeleteModal);
  confirmDeleteButton.addEventListener("click", deleteSelected);

  bindModalClose(
    deleteModal,
    [document.querySelector("#close-delete"), document.querySelector("#cancel-delete")],
    closeDeleteModal
  );

  // The Delete key opens the confirmation (unless typing or in a modal)
  document.addEventListener("keydown", event => {
    if (
      event.key === "Delete" &&
      !event.target.closest("input, textarea") &&
      !isAnyModalOpen()
    ) {
      openDeleteModal();
    }
  });
}
