import { initContextMenu } from "./context-menu.js";
import { closeDeleteModal, initDeleteModal } from "./delete-modal.js";
import { initFileBrowser, renderFiles } from "./files.js";
import { closeFolderModal, initFolderModal } from "./folder-modal.js";
import { initBoxSelection } from "./selection.js";
import { initTheme } from "./theme.js";
import { closeUploadModal, initUpload } from "./upload.js";

initTheme();
initFileBrowser();
initBoxSelection();
initUpload();
initFolderModal();
initDeleteModal();
initContextMenu();

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeDeleteModal();
    closeFolderModal();
    closeUploadModal();
  }
});

renderFiles();
