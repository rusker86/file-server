import * as api from "./api.js";
import { renderFiles } from "./files.js";
import { bindModalClose, closeModal, openModal } from "./modal.js";
import { state } from "./state.js";
import { showToast } from "./toast.js";

const newFolderButton = document.querySelector("#new-folder");
const folderModal = document.querySelector("#folder-modal");
const folderForm = document.querySelector("#folder-form");
const folderNameInput = document.querySelector("#folder-name");

export function openFolderModal() {
  openModal(folderModal);
  folderNameInput.focus();
}

export function closeFolderModal() {
  closeModal(folderModal);
  folderForm.reset();
}

async function submitFolder(event) {
  event.preventDefault();

  const name = folderNameInput.value.trim();

  if (!name) {
    showToast("Folder name is required.", "error");
    return;
  }

  try {
    await api.createFolder(name, state.currentPath);

    closeFolderModal();
    await renderFiles();

    showToast("Folder created successfully.", "success");
  } catch (error) {
    console.error(error);
    showToast(error.message || "Something went wrong while creating the folder.", "error");
  }
}

export function initFolderModal() {
  newFolderButton.addEventListener("click", openFolderModal);
  folderForm.addEventListener("submit", submitFolder);

  bindModalClose(
    folderModal,
    [document.querySelector("#close-folder"), document.querySelector("#cancel-folder")],
    closeFolderModal
  );
}
