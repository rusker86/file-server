import { joinPath, state } from "./state.js";

const selectedItems = new Set();
const listeners = new Set();

let selectionBox = null;
let startX = 0;
let startY = 0;

function notify() {
  listeners.forEach(listener => listener(selectedItems.size));
}

export function onSelectionChange(listener) {
  listeners.add(listener);
}

export function getSelectedFiles() {
  return [...selectedItems];
}

export function getSelectedPaths() {
  return getSelectedFiles().map(file => joinPath(state.currentPath, file.name));
}

export function isSelected(file) {
  return selectedItems.has(file);
}

export function selectItem(fileItem) {
  selectedItems.add(fileItem._file);
  fileItem.classList.add("selected");
  notify();
}

export function deselectItem(fileItem) {
  selectedItems.delete(fileItem._file);
  fileItem.classList.remove("selected");
  notify();
}

export function toggleItem(fileItem) {
  if (isSelected(fileItem._file)) {
    deselectItem(fileItem);
  } else {
    selectItem(fileItem);
  }
}

export function clearSelection() {
  selectedItems.clear();

  document
    .querySelectorAll(".file-item.selected")
    .forEach(item => item.classList.remove("selected"));

  notify();
}

/* Rubber-band (box) selection */

function intersects(a, b) {
  return (
    a.left < b.right &&
    a.right > b.left &&
    a.top < b.bottom &&
    a.bottom > b.top
  );
}

function updateBoxSelection() {
  const boxRect = selectionBox.getBoundingClientRect();

  document.querySelectorAll(".file-item").forEach(item => {
    if (intersects(item.getBoundingClientRect(), boxRect)) {
      selectItem(item);
    } else {
      deselectItem(item);
    }
  });
}

function onMouseDown(event) {
  // Left button only, and never over files, buttons, inputs, modals or menus
  if (
    event.button !== 0 ||
    event.target.closest(".file-item, button, input, .modal, .context-menu")
  ) {
    return;
  }

  clearSelection();

  startX = event.clientX;
  startY = event.clientY;

  selectionBox = document.createElement("div");
  selectionBox.classList.add("selection-box");
  Object.assign(selectionBox.style, {
    left: `${startX}px`,
    top: `${startY}px`,
    width: "0px",
    height: "0px",
  });

  document.body.appendChild(selectionBox);

  event.preventDefault();
}

function onMouseMove(event) {
  if (!selectionBox) {
    return;
  }

  Object.assign(selectionBox.style, {
    left: `${Math.min(startX, event.clientX)}px`,
    top: `${Math.min(startY, event.clientY)}px`,
    width: `${Math.abs(event.clientX - startX)}px`,
    height: `${Math.abs(event.clientY - startY)}px`,
  });

  updateBoxSelection();
}

function onMouseUp() {
  selectionBox?.remove();
  selectionBox = null;
}

export function initBoxSelection() {
  document.addEventListener("mousedown", onMouseDown);
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
}
