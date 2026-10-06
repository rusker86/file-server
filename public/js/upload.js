import * as api from "./api.js";
import { renderFiles } from "./files.js";
import { bindModalClose, closeModal, openModal } from "./modal.js";
import { state } from "./state.js";
import { showToast } from "./toast.js";

const uploadButton = document.querySelector("#upload");
const fileInput = document.querySelector("#file-input");
const uploadModal = document.querySelector("#upload-modal");
const closeUploadButton = document.querySelector("#close-upload");
const cancelUploadButton = document.querySelector("#cancel-upload");
const dropzone = document.querySelector("#upload-dropzone");
const uploadFileList = document.querySelector("#upload-file-list");
const startUploadButton = document.querySelector("#start-upload");

let selectedFiles = [];
let uploading = false;

function updateSelectedFiles() {
  uploadFileList.replaceChildren(
    ...selectedFiles.map(file => {
      const item = document.createElement("li");
      item.textContent = file.name;
      return item;
    })
  );
  uploadFileList.hidden = selectedFiles.length === 0;
  startUploadButton.disabled = selectedFiles.length === 0 || uploading;
}

function addFiles(files) {
  selectedFiles.push(...files);
  updateSelectedFiles();
}

function openUploadModal() {
  selectedFiles = [];
  updateSelectedFiles();
  openModal(uploadModal);
}

export function closeUploadModal() {
  if (uploading) {
    return;
  }

  selectedFiles = [];
  updateSelectedFiles();
  closeModal(uploadModal);
}

async function uploadFiles(files, closeOnSuccess = false) {
  if (!files.length) {
    return;
  }

  uploading = true;
  updateSelectedFiles();
  startUploadButton.disabled = true;
  uploadButton.disabled = true;

  try {
    await api.uploadFiles(files, state.currentPath);
    await renderFiles();

    showToast("Files uploaded successfully.", "success");
    if (closeOnSuccess) {
      selectedFiles = [];
      updateSelectedFiles();
      closeModal(uploadModal);
    }
  } catch (error) {
    console.error(error);
    showToast(error.message || "An error occurred while uploading the files.", "error");
  } finally {
    uploading = false;
    uploadButton.disabled = false;
    updateSelectedFiles();
  }
}

function hasFileTransfer(event) {
  return Array.from(event.dataTransfer?.types ?? []).includes("Files");
}

export function initUpload() {
  uploadButton.addEventListener("click", openUploadModal);
  dropzone.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => {
    addFiles(Array.from(fileInput.files));
    fileInput.value = "";
  });

  dropzone.addEventListener("dragover", event => {
    if (!hasFileTransfer(event)) {
      return;
    }

    event.preventDefault();
    dropzone.classList.add("is-dragging");
  });

  dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("is-dragging");
  });

  dropzone.addEventListener("drop", event => {
    if (!hasFileTransfer(event)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    dropzone.classList.remove("is-dragging");
    addFiles(Array.from(event.dataTransfer.files));
  });

  window.addEventListener("dragover", event => {
    if (!hasFileTransfer(event)) {
      return;
    }

    event.preventDefault();
    if (uploadModal.classList.contains("hidden")) {
      document.body.classList.add("file-drop-active");
    }
  });

  window.addEventListener("dragleave", event => {
    if (event.relatedTarget === null) {
      document.body.classList.remove("file-drop-active");
    }
  });

  window.addEventListener("drop", event => {
    document.body.classList.remove("file-drop-active");

    if (!hasFileTransfer(event)) {
      return;
    }

    event.preventDefault();
    if (uploadModal.classList.contains("hidden")) {
      void uploadFiles(Array.from(event.dataTransfer.files));
    }
  });

  bindModalClose(
    uploadModal,
    [closeUploadButton, cancelUploadButton],
    closeUploadModal
  );
  startUploadButton.addEventListener("click", () => {
    void uploadFiles([...selectedFiles], true);
  });
}
