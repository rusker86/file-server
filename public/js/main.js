import { initContextMenu } from "./context-menu.js";
import { closeDeleteModal, initDeleteModal } from "./delete-modal.js";
import { initFileBrowser, renderFiles } from "./files.js";
import { closeFolderModal, initFolderModal } from "./folder-modal.js";
import { initBoxSelection } from "./selection.js";
import { initTheme } from "./theme.js";
import { closeUploadModal, initUpload } from "./upload.js";

const menuToggle = document.querySelector("#menu-toggle");
const headerActions = document.querySelector("#header-actions");

function closeHeaderMenu() {
  headerActions.classList.remove("is-open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open actions menu");
}

menuToggle.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  headerActions.classList.toggle("is-open", !isOpen);
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Open actions menu" : "Close actions menu");
});

headerActions.addEventListener("click", event => {
  if (event.target.closest("button")) {
    closeHeaderMenu();
  }
});

document.addEventListener("click", event => {
  if (!event.target.closest("#menu-toggle, #header-actions")) {
    closeHeaderMenu();
  }
});

window.matchMedia("(min-width: 601px)").addEventListener("change", event => {
  if (event.matches) {
    closeHeaderMenu();
  }
});

initTheme();
initFileBrowser();
initBoxSelection();
initUpload();
initFolderModal();
initDeleteModal();
initContextMenu();

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeHeaderMenu();
    closeDeleteModal();
    closeFolderModal();
    closeUploadModal();
  }
});

renderFiles();
