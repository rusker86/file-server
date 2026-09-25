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
  renderFiles(previousPath)
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

renderFiles()
