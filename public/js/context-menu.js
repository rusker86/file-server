import { openDeleteModal } from "./delete-modal.js";
import { openFolderModal } from "./folder-modal.js";
import {
  clearSelection,
  getSelectedFiles,
  isSelected,
  selectItem,
} from "./selection.js";

const menu = document.querySelector("#context-menu");
const deleteItem = menu.querySelector('[data-action="delete"]');

const actions = {
  "new-folder": openFolderModal,
  delete: openDeleteModal,
};

function menuButtons() {
  return [...menu.querySelectorAll(".context-menu-item:not(:disabled)")];
}

function isOpen() {
  return !menu.classList.contains("hidden");
}

export function closeContextMenu() {
  menu.classList.add("hidden");
}

function openContextMenu(x, y) {
  const count = getSelectedFiles().length;

  deleteItem.disabled = count === 0;
  deleteItem.querySelector(".context-menu-label").textContent =
    count > 1 ? `Delete ${count} items` : "Delete";

  menu.classList.remove("hidden");

  // Keep the menu inside the viewport
  const { width, height } = menu.getBoundingClientRect();
  const left = Math.min(x, window.innerWidth - width - 4);
  const top = Math.min(y, window.innerHeight - height - 4);

  menu.style.left = `${Math.max(4, left)}px`;
  menu.style.top = `${Math.max(4, top)}px`;

  menuButtons()[0]?.focus();
}

function onContextMenu(event) {
  // Keep the native menu inside modals and text inputs
  if (event.target.closest(".modal, input, textarea")) {
    closeContextMenu();
    return;
  }

  event.preventDefault();

  const fileItem = event.target.closest(".file-item");

  if (fileItem) {
    // Right-clicking an unselected item selects only that item;
    // right-clicking inside the current selection keeps it.
    if (!isSelected(fileItem._file)) {
      clearSelection();
      selectItem(fileItem);
    }
  } else if (!event.target.closest(".context-menu")) {
    clearSelection();
  }

  openContextMenu(event.clientX, event.clientY);
}

function onKeyDown(event) {
  if (!isOpen()) {
    return;
  }

  const buttons = menuButtons();
  const index = buttons.indexOf(document.activeElement);

  if (event.key === "Escape") {
    event.preventDefault();
    closeContextMenu();
  } else if (event.key === "ArrowDown") {
    event.preventDefault();
    buttons[(index + 1) % buttons.length]?.focus();
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    buttons[(index - 1 + buttons.length) % buttons.length]?.focus();
  }
}

export function initContextMenu() {
  document.addEventListener("contextmenu", onContextMenu);
  document.addEventListener("keydown", onKeyDown, true);

  menu.addEventListener("click", event => {
    const button = event.target.closest(".context-menu-item");

    if (!button || button.disabled) {
      return;
    }

    closeContextMenu();
    actions[button.dataset.action]?.();
  });

  document.addEventListener("mousedown", event => {
    if (!event.target.closest(".context-menu")) {
      closeContextMenu();
    }
  });

  window.addEventListener("blur", closeContextMenu);
  window.addEventListener("resize", closeContextMenu);
  window.addEventListener("scroll", closeContextMenu, true);
}
