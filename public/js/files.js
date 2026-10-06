import * as api from "./api.js";
import {
  clearSelection,
  getSelectedFiles,
  getSelectedPaths,
  selectItem,
  toggleItem,
} from "./selection.js";
import { displayName, isDirectory, joinPath, parentPath, state } from "./state.js";
import { showToast } from "./toast.js";

const filesList = document.querySelector(".files");
const emptyState = document.querySelector("#empty-state");
const backButton = document.querySelector("#back");
const currentPathLabel = document.querySelector("#current-path");

let draggedPaths = [];

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
  fileItem.draggable = true;
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

  fileItem.addEventListener("dragstart", event => {
    draggedPaths = getSelectedFiles().includes(file)
      ? getSelectedPaths()
      : [joinPath(state.currentPath, file.name)];

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/json", JSON.stringify(draggedPaths));
  });

  fileItem.addEventListener("dragend", () => {
    draggedPaths = [];
    document.querySelectorAll(".file-item.drop-target")
      .forEach(item => item.classList.remove("drop-target"));
  });

  if (isDirectory(file)) {
    fileItem.addEventListener("dragover", event => {
      const destination = joinPath(state.currentPath, file.name);

      if (!canMoveTo(destination, draggedPaths)) {
        return;
      }

      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      fileItem.classList.add("drop-target");
    });

    fileItem.addEventListener("dragleave", () => {
      fileItem.classList.remove("drop-target");
    });

    fileItem.addEventListener("drop", async event => {
      event.preventDefault();
      fileItem.classList.remove("drop-target");

      const destination = joinPath(state.currentPath, file.name);
      const sources = draggedPaths;

      if (!canMoveTo(destination, sources)) {
        return;
      }

      try {
        const result = await api.moveFiles(sources, destination);
        showToast(result.message || "Items moved successfully.");
        await renderFiles();
      } catch (error) {
        showToast(error.message || "Could not move the selected items.", "error");
      }
    });
  }

  return fileItem;
}

function canMoveTo(destination, sources) {
  if (sources.length === 0) {
    return false;
  }

  const normalizedDestination = destination.replace(/\/+$/, "");

  return sources.every(source => {
    const normalizedSource = source.replace(/\/+$/, "");
    return normalizedSource !== normalizedDestination &&
      !normalizedDestination.startsWith(`${normalizedSource}/`);
  });
}

export async function renderFiles(path = state.currentPath) {
  try {
    const { files } = await api.listFiles(path);

    // Selected file objects become stale after reloading the list
    clearSelection();

    filesList.replaceChildren(...files.map(createFileItem));
    emptyState.hidden = files.length > 0;

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
