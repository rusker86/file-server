const filesDiv = document.querySelector('.files');
const backButton = document.querySelector('#back');

let currentPath = "";

backButton.addEventListener('click', () => {
  if (currentPath === "") {
    return;
  }

  const parts = currentPath.split('/').filter(Boolean);
  parts.pop();

  const previousPath = parts.length ? "/" + parts.join('/') : '';

  renderFiles(previousPath);
});


function handleFileClick(file, path) {
  return async () => {
    if (file.name.startsWith('/')) {
      path = `${path}${file.name}`;
      await renderFiles(path);
    } else {
      window.location.href = `/api/download${path}/${file.name}`;
    }
  };
}


async function renderFiles(path = "") {
  const response = await fetch(`/api/files${path}`);
  const data = await response.json();

  filesDiv.innerHTML = "";

  data.files.forEach(file => {
    const fileItem = document.createElement("li");
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

    fileItem.addEventListener(
      "click",
      handleFileClick(file, path)
    );

    filesDiv.appendChild(fileItem);
  });

  currentPath = path;
}


/* =========================
   Theme
   ========================= */

const themeButton = document.querySelector('#theme');

const savedTheme = localStorage.getItem('theme');

if (savedTheme === 'dark') {
  document.documentElement.classList.add('dark');
  themeButton.textContent = '☀️';
}

themeButton.addEventListener('click', () => {
  const dark = document.documentElement.classList.toggle('dark');

  localStorage.setItem('theme', dark ? 'dark' : 'light');

  themeButton.textContent = dark ? '☀️' : '🌙';
});


/* =========================
   Upload
   ========================= */

const uploadButton = document.querySelector('#upload');
const uploadModal = document.querySelector('#upload-modal');
const closeUploadButton = document.querySelector('#close-upload');
const cancelUploadButton = document.querySelector('#cancel-upload');

const dropZone = document.querySelector('#drop-zone');
const fileInput = document.querySelector('#file-input');
const uploadList = document.querySelector('#upload-list');
const startUploadButton = document.querySelector('#start-upload');

let selectedFiles = [];


/*
 * Open / close modal
 */

function openUploadModal() {
  uploadModal.classList.remove('hidden');
}

function closeUploadModal() {
  uploadModal.classList.add('hidden');

  selectedFiles = [];
  fileInput.value = "";

  renderUploadList();
}

uploadButton.addEventListener('click', openUploadModal);

closeUploadButton.addEventListener('click', closeUploadModal);

cancelUploadButton.addEventListener('click', closeUploadModal);


/*
 * Click on drop zone
 */

dropZone.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', () => {
  addFiles(fileInput.files);
});


/*
 * Drag and drop
 */

dropZone.addEventListener('dragover', event => {
  event.preventDefault();

  dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', event => {
  event.preventDefault();

  dropZone.classList.remove('dragover');

  addFiles(event.dataTransfer.files);
});


/*
 * Files
 */

function addFiles(files) {
  selectedFiles.push(...Array.from(files));

  renderUploadList();
}


function renderUploadList() {
  uploadList.innerHTML = "";

  selectedFiles.forEach(file => {
    const item = document.createElement('li');

    const name = document.createElement('span');
    const size = document.createElement('span');

    name.classList.add('upload-file-name');
    size.classList.add('upload-file-size');

    name.textContent = file.name;
    size.textContent = formatFileSize(file.size);

    item.appendChild(name);
    item.appendChild(size);

    uploadList.appendChild(item);
  });
}


function formatFileSize(bytes) {
  if (bytes === 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));

  return `${(bytes / Math.pow(1024, index)).toFixed(1)} ${units[index]}`;
}


/*
 * Upload
 */

startUploadButton.addEventListener('click', async () => {
  if (selectedFiles.length === 0) {
    return;
  }

  startUploadButton.disabled = true;
  startUploadButton.textContent = 'Uploading...';

  try {
    for (const file of selectedFiles) {
      const formData = new FormData();

      formData.append('file', file);
      formData.append('path', currentPath);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${file.name}`);
      }
    }

    closeUploadModal();

    await renderFiles(currentPath);

  } catch (error) {
    console.error(error);

    alert('An error occurred while uploading the files.');

  } finally {
    startUploadButton.disabled = false;
    startUploadButton.textContent = 'Upload';
  }
});

const newFolderButton = document.querySelector('#new-folder');
const folderModal = document.querySelector('#folder-modal');
const closeFolderButton = document.querySelector('#close-folder');
const cancelFolderButton = document.querySelector('#cancel-folder');
const folderForm = document.querySelector('#folder-form');
const folderNameInput = document.querySelector('#folder-name');

function openFolderModal() {
  folderModal.classList.remove('hidden');
  folderNameInput.focus();
}

function closeFolderModal() {
  folderModal.classList.add('hidden');
  folderForm.reset();
}

newFolderButton.addEventListener('click', openFolderModal);
closeFolderButton.addEventListener('click', closeFolderModal);
cancelFolderButton.addEventListener('click', closeFolderModal);

folderForm.addEventListener('submit', async event => {
  event.preventDefault();

  const name = folderNameInput.value.trim();

  if (!name) {
    showToast('Please enter a folder name.', 'error');
    return;
  }

  try {
    const response = await fetch('/api/folders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        path: currentPath
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Could not create the folder.');
    }

    closeFolderModal();
    await renderFiles(currentPath);

    showToast('Folder created successfully.', 'success');

  } catch (error) {
    console.error(error);
    showToast(error.message, 'error');
  }
});

function getErrorMessage(status, data) {
  if (status === 400) {
    return data.message || "The folder name is not valid.";
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

const toastContainer = document.querySelector('#toast-container');

function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');

  toast.classList.add('toast', type);
  toast.textContent = message;

  toastContainer.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');

    toast.addEventListener('transitionend', () => {
      toast.remove();
    }, { once: true });
  }, duration);
}
/* =========================
   Initial render
   ========================= */

renderFiles();
