import * as api from "./api.js";
import { renderFiles } from "./files.js";
import { state } from "./state.js";
import { showToast } from "./toast.js";

const uploadButton = document.querySelector("#upload");
const fileInput = document.querySelector("#file-input");

async function uploadSelectedFiles() {
  const files = fileInput.files;

  if (!files.length) {
    return;
  }

  try {
    await api.uploadFiles(files, state.currentPath);
    await renderFiles();

    showToast("Files uploaded successfully.", "success");
  } catch (error) {
    console.error(error);
    showToast(error.message || "An error occurred while uploading the files.", "error");
  } finally {
    // Allows selecting the same file again later
    fileInput.value = "";
  }
}

export function initUpload() {
  uploadButton.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", uploadSelectedFiles);
}
