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


async function getData(path) {
  const response = await fetch(`/api/files${path}`);

  console.log(response);
  const data = await response.json();
  console.log(data);
  data.files.forEach(file => {
    const fileItem = document.createElement('li');
    fileItem.textContent = file.name;
    fileItem.addEventListener('click', handleFileClick(file, path));
    filesDiv.appendChild(fileItem);

  });
}


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
    fileItem.textContent = file.name;

    fileItem.addEventListener("click", handleFileClick(file, path));

    filesDiv.appendChild(fileItem);
  });

  currentPath = path;
}

renderFiles()
