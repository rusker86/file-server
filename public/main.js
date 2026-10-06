const filesDiv = document.querySelector('.files');
const backButton = document.querySelector('#back');

let currentPath = "";

let selectedItems = new Set();

let isSelecting = false;
let selectionStartX = 0;
let selectionStartY = 0;
let selectionBox = null;


/* =========================
   THEME
========================= */

const root = document.documentElement;

function applyTheme(theme) {
  root.classList.toggle("dark", theme === "dark");
  localStorage.setItem("theme", theme);

  const btn = document.querySelector("#theme-toggle");

  if (btn) {
    btn.textContent = theme === "dark" ? "☀️" : "🌙";
  }
}

// Si el HTML no tiene el botón, lo creamos
let themeToggle = document.querySelector("#theme-toggle");

if (!themeToggle) {
  themeToggle = document.createElement("button");
  themeToggle.id = "theme-toggle";
  themeToggle.type = "button";
  themeToggle.title = "Cambiar tema";

  (document.querySelector(".controls") || document.body)
    .appendChild(themeToggle);
}

themeToggle.addEventListener("click", () => {
  applyTheme(root.classList.contains("dark") ? "light" : "dark");
});

// Tema guardado, o el del sistema si no hay ninguno
applyTheme(
  localStorage.getItem("theme") ??
  (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
);


/* =========================
   FILE RENDERING
========================= */

async function renderFiles(path = "") {
  try {
    const response = await fetch(`/api/files${path}`);
    const data = await response.json();

    filesDiv.innerHTML = "";

    // Los objetos guardados en la selección quedan obsoletos al recargar
    clearSelection();

    data.files.forEach(file => {
      const fileItem = document.createElement("li");

      fileItem.classList.add("file-item");

      // Guardamos el archivo en el elemento
      // para usarlo posteriormente en la selección
      fileItem._file = file;

      const icon = document.createElement("span");
      const name = document.createElement("span");

      icon.classList.add("file-icon");
      name.classList.add("file-name");

      if (file.type === "isDirectory") {
        icon.textContent = "📁";
        fileItem.classList.add("directory");
      } else {
        icon.textContent = "📄";
        fileItem.classList.add("file");
      }

      name.textContent = file.name.replace(/^\//, "");

      fileItem.appendChild(icon);
      fileItem.appendChild(name);


      /*
       * CLICK
       *
       * Un clic selecciona el elemento.
       */
      fileItem.addEventListener("click", event => {
        event.stopPropagation();

        clearSelection();
        selectItem(fileItem, file);
      });


      /*
       * DOUBLE CLICK
       *
       * Una carpeta se abre.
       * Un archivo se descarga.
       */
      fileItem.addEventListener("dblclick", async () => {
        if (file.name.startsWith("/")) {
          const newPath = `${path}${file.name}`;

          await renderFiles(newPath);
        } else {
          window.location.href =
            `/api/download${path}/${file.name}`;
        }
      });


      filesDiv.appendChild(fileItem);
    });

    currentPath = path;

  } catch (error) {
    console.error("Error loading files:", error);

    showToast(
      "Could not load the files.",
      "error"
    );
  }
}


/* =========================
   BACK BUTTON
========================= */

backButton.addEventListener("click", async () => {
  if (!currentPath) {
    return;
  }

  const parts = currentPath.split("/").filter(Boolean);

  parts.pop();

  const parentPath =
    parts.length > 0
      ? "/" + parts.join("/") + "/"
      : "";

  clearSelection();

  await renderFiles(parentPath);
});


/* =========================
   SELECTION
========================= */

function createSelectionBox() {
  selectionBox = document.createElement("div");

  selectionBox.classList.add("selection-box");

  document.body.appendChild(selectionBox);
}


function removeSelectionBox() {
  if (!selectionBox) {
    return;
  }

  selectionBox.remove();

  selectionBox = null;
}


function selectItem(fileItem, file) {
  selectedItems.add(file);

  fileItem.classList.add("selected");

  updateDeleteButton();
}


function deselectItem(fileItem, file) {
  selectedItems.delete(file);

  fileItem.classList.remove("selected");

  updateDeleteButton();
}


function clearSelection() {
  selectedItems.clear();

  document
    .querySelectorAll(".file-item.selected")
    .forEach(item => {
      item.classList.remove("selected");
    });

  updateDeleteButton();
}


function updateSelection() {
  if (!selectionBox) {
    return;
  }

  const selectionRect =
    selectionBox.getBoundingClientRect();

  document
    .querySelectorAll(".file-item")
    .forEach(item => {

      const itemRect =
        item.getBoundingClientRect();

      const intersects =
        itemRect.left < selectionRect.right &&
        itemRect.right > selectionRect.left &&
        itemRect.top < selectionRect.bottom &&
        itemRect.bottom > selectionRect.top;

      const file = item._file;

      if (intersects) {
        selectItem(item, file);
      } else {
        deselectItem(item, file);
      }
    });
}


/* =========================
   MOUSE SELECTION
========================= */

document.addEventListener("mousedown", event => {

  // Solo botón izquierdo
  if (event.button !== 0) {
    return;
  }


  /*
   * No iniciar selección sobre archivos,
   * botones, inputs o modales.
   */
  if (event.target.closest(".file-item, button, input, .modal")) {
    return;
  }


  isSelecting = true;

  selectionStartX = event.clientX;
  selectionStartY = event.clientY;


  // Empezamos una selección nueva
  clearSelection();

  createSelectionBox();


  // Posición inicial
  selectionBox.style.left =
    `${selectionStartX}px`;

  selectionBox.style.top =
    `${selectionStartY}px`;

  selectionBox.style.width = "0px";
  selectionBox.style.height = "0px";


  event.preventDefault();
});


document.addEventListener("mousemove", event => {

  if (!isSelecting || !selectionBox) {
    return;
  }


  const currentX = event.clientX;
  const currentY = event.clientY;


  /*
   * Math.min permite seleccionar
   * tanto hacia abajo/derecha como
   * hacia arriba/izquierda.
   */
  const left =
    Math.min(selectionStartX, currentX);

  const top =
    Math.min(selectionStartY, currentY);


  const width =
    Math.abs(currentX - selectionStartX);

  const height =
    Math.abs(currentY - selectionStartY);


  selectionBox.style.left =
    `${left}px`;

  selectionBox.style.top =
    `${top}px`;

  selectionBox.style.width =
    `${width}px`;

  selectionBox.style.height =
    `${height}px`;


  updateSelection();
});


document.addEventListener("mouseup", () => {

  if (!isSelecting) {
    return;
  }

  isSelecting = false;

  removeSelectionBox();
});


/* =========================
   UPLOAD
========================= */

const uploadButton =
  document.querySelector("#upload");

const fileInput =
  document.querySelector("#file-input");


if (uploadButton && fileInput) {

  uploadButton.addEventListener("click", () => {
    fileInput.click();
  });


  fileInput.addEventListener("change", async () => {

    const files = fileInput.files;

    if (!files.length) {
      return;
    }


    const formData = new FormData();

    for (const file of files) {
      formData.append("file", file);
    }

    formData.append("path", currentPath);


    try {

      const response = await fetch(
        "/api/upload/",
        {
          method: "POST",
          body: formData
        }
      );


      const data = await response.json();


      if (!response.ok) {
        throw new Error(
          data.message ||
          "Could not upload the files."
        );
      }


      await renderFiles(currentPath);


      showToast(
        "Files uploaded successfully.",
        "success"
      );

    } catch (error) {

      console.error(error);

      showToast(
        error.message ||
        "An error occurred while uploading the files.",
        "error"
      );
    }


    // Permite volver a seleccionar
    // el mismo archivo posteriormente.
    fileInput.value = "";
  });
}


/* =========================
   NEW FOLDER MODAL
========================= */

const newFolderButton =
  document.querySelector("#new-folder");

const folderModal =
  document.querySelector("#folder-modal");

const folderForm =
  document.querySelector("#folder-form");

const folderNameInput =
  document.querySelector("#folder-name");

const closeFolderButton =
  document.querySelector("#close-folder");

const cancelFolderButton =
  document.querySelector("#cancel-folder");


if (newFolderButton) {

  newFolderButton.addEventListener("click", () => {

    folderModal.classList.remove("hidden");

    folderNameInput.focus();
  });
}


function closeFolderModal() {

  folderModal.classList.add("hidden");

  folderForm.reset();
}


closeFolderButton?.addEventListener(
  "click",
  closeFolderModal
);

cancelFolderButton?.addEventListener(
  "click",
  closeFolderModal
);


if (folderModal) {

  folderModal.addEventListener(
    "click",
    event => {

      if (event.target === folderModal) {
        closeFolderModal();
      }
    }
  );
}


if (folderForm) {

  folderForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      const name =
        folderNameInput.value.trim();


      if (!name) {

        showToast(
          "Folder name is required.",
          "error"
        );

        return;
      }


      try {

        const response = await fetch(
          "/api/folders",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              name,
              path: currentPath
            })
          }
        );


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data.message ||
            getErrorMessage(
              response.status,
              data
            )
          );
        }


        closeFolderModal();

        await renderFiles(currentPath);


        showToast(
          "Folder created successfully.",
          "success"
        );

      } catch (error) {

        console.error(error);

        showToast(
          error.message ||
          "Something went wrong while creating the folder.",
          "error"
        );
      }
    }
  );
}


/* =========================
   FOLDER ERRORS
========================= */

function getErrorMessage(status, data) {

  if (status === 400) {
    return data.message ||
      "The folder name is not valid.";
  }

  if (status === 409) {
    return "A folder with that name already exists.";
  }

  if (status === 403) {
    return "You don't have permission to create a folder here.";
  }

  if (status === 404) {
    return "The current folder no longer exists.";
  }

  return "Something went wrong while creating the folder.";
}


/* =========================
   DELETE
========================= */

const deleteButton =
  document.querySelector("#delete");

const deleteModal =
  document.querySelector("#delete-modal");

const deleteMessage =
  document.querySelector("#delete-message");

const deleteList =
  document.querySelector("#delete-list");

const confirmDeleteButton =
  document.querySelector("#confirm-delete");

const cancelDeleteButton =
  document.querySelector("#cancel-delete");

const closeDeleteButton =
  document.querySelector("#close-delete");


function updateDeleteButton() {
  if (!deleteButton) {
    return;
  }

  const count = selectedItems.size;

  deleteButton.disabled = count === 0;

  deleteButton.textContent =
    count > 0
      ? `🗑️ Delete (${count})`
      : "🗑️ Delete";
}


// Ruta completa y normalizada: "/carpeta/archivo.txt"
function getFilePath(file) {
  const base = currentPath.replace(/\/+$/, "");
  const name = file.name.replace(/^\/+/, "");

  return `${base}/${name}`;
}


function openDeleteModal() {
  if (selectedItems.size === 0) {
    return;
  }

  const count = selectedItems.size;

  deleteMessage.textContent =
    count === 1
      ? "This item will be permanently deleted:"
      : `These ${count} items will be permanently deleted:`;

  deleteList.innerHTML = "";

  selectedItems.forEach(file => {
    const li = document.createElement("li");
    const name = document.createElement("span");

    name.classList.add("upload-file-name");

    name.textContent =
      (file.type === "isDirectory" ? "📁 " : "📄 ") +
      file.name.replace(/^\//, "");

    li.appendChild(name);
    deleteList.appendChild(li);
  });

  deleteModal.classList.remove("hidden");

  confirmDeleteButton.focus();
}


function closeDeleteModal() {
  deleteModal.classList.add("hidden");
}


async function deleteSelected() {
  const paths = [...selectedItems].map(getFilePath);

  confirmDeleteButton.disabled = true;

  try {

    const response = await fetch(
      "/api/files",
      {
        method: "DELETE",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          files: paths
        })
      }
    );


    const data =
      await response.json().catch(() => ({}));


    if (!response.ok) {
      throw new Error(
        data.message ||
        "Could not delete the selected items."
      );
    }


    closeDeleteModal();

    await renderFiles(currentPath);


    showToast(
      paths.length === 1
        ? "Item deleted."
        : `${paths.length} items deleted.`,
      "success"
    );

  } catch (error) {

    console.error(error);

    showToast(
      error.message ||
      "An error occurred while deleting.",
      "error"
    );

  } finally {
    confirmDeleteButton.disabled = false;
  }
}


deleteButton?.addEventListener(
  "click",
  openDeleteModal
);

confirmDeleteButton?.addEventListener(
  "click",
  deleteSelected
);

cancelDeleteButton?.addEventListener(
  "click",
  closeDeleteModal
);

closeDeleteButton?.addEventListener(
  "click",
  closeDeleteModal
);

deleteModal?.addEventListener("click", event => {
  if (event.target === deleteModal) {
    closeDeleteModal();
  }
});


document.addEventListener("keydown", event => {

  if (event.key === "Escape") {
    closeDeleteModal();
    closeFolderModal();
  }

  // Tecla Supr abre la confirmación
  // (si no se está escribiendo en un input)
  if (
    event.key === "Delete" &&
    !event.target.closest("input, textarea")
  ) {
    openDeleteModal();
  }
});


/* =========================
   TOASTS
========================= */

const toastContainer =
  document.querySelector("#toast-container");


function showToast(
  message,
  type = "info",
  duration = 3000
) {

  if (!toastContainer) {
    return;
  }


  const toast =
    document.createElement("div");

  toast.classList.add(
    "toast",
    type
  );


  toast.textContent = message;


  toastContainer.appendChild(toast);


  requestAnimationFrame(() => {
    toast.classList.add("show");
  });


  setTimeout(() => {

    toast.classList.remove("show");


    toast.addEventListener(
      "transitionend",
      () => {
        toast.remove();
      },
      {
        once: true
      }
    );

  }, duration);
}


/* =========================
   INITIAL LOAD
========================= */

renderFiles();
