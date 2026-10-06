import * as api from "./api.js";
import { clearSelection, selectItem, toggleItem } from "./selection.js";
import { displayName, isDirectory, joinPath, parentPath, state } from "./state.js";
import { showToast } from "./toast.js";

const filesList = document.querySelector(".files");
const backButton = document.querySelector("#back");
const currentPathLabel = document.querySelector("#current-path");

function openItem(file) {
  const path = joinPath(state.currentPath, file.name);

  if (isDirectory(file)) {
    renderFiles(path);
  } else {
    window.location.href = api.downloadUrl(path);
  }
}

function createFileItem(file) {
  const fileItem = document.createElement("li");
  const icon = document.createElement("span");
  const name = document.createElement("span");

  // Keep a reference to the file so selection can read it back from the DOM
  fileItem._file = file;

  fileItem.classList.add("file-item", isDirectory(file) ? "directory" : "file");
  icon.classList.add("file-icon");
  name.classList.add("file-name");

  icon.textContent = isDirectory(file) ? "📁" : "📄";
  name.textContent = displayName(file);

  fileItem.append(icon, name);

  // Click selects (Ctrl/Cmd + click toggles), double click opens/downloads
  fileItem.addEventListener("click", event => {
    event.stopPropagation();

    if (event.ctrlKey || event.metaKey) {
      toggleItem(fileItem);
      return;
    }

    clearSelection();
    selectItem(fileItem);
  });

  fileItem.addEventListener("dblclick", () => openItem(file));

  return fileItem;
}

export async function renderFiles(path = state.currentPath) {
  try {
    const { files } = await api.listFiles(path);

    // Selected file objects become stale after reloading the list
    clearSelection();

    filesList.replaceChildren(...files.map(createFileItem));

    state.currentPath = path;
    currentPathLabel.textContent = path || "/";
    backButton.disabled = path === "";
  } catch (error) {
    console.error("Error loading files:", error);
    showToast(error.message || "Could not load the files.", "error");
  }
}

export function initFileBrowser() {
  backButton.addEventListener("click", () => {
    if (state.currentPath) {
      renderFiles(parentPath(state.currentPath));
    }
  });
}
