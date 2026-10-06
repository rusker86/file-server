function encodePath(path) {
  return path
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");
}

async function request(url, options = {}, fallbackMessage = "Request failed.") {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || fallbackMessage);
  }

  return data;
}

function jsonOptions(method, body) {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

export function listFiles(path) {
  return request(
    `/api/files/${encodePath(path)}`,
    {},
    "Could not load the files."
  );
}

export function downloadUrl(path) {
  return `/api/download/${encodePath(path)}`;
}

export function createFolder(name, path) {
  return request(
    "/api/folders",
    jsonOptions("POST", { name, path }),
    "Could not create the folder."
  );
}

export function deleteFiles(paths) {
  return request(
    "/api/files",
    jsonOptions("DELETE", { files: paths }),
    "Could not delete the selected items."
  );
}

export function moveFiles(files, destination) {
  return request(
    "/api/move",
    jsonOptions("POST", { files, destination }),
    "Could not move the selected items."
  );
}

export function uploadFiles(files, path) {
  const formData = new FormData();

  for (const file of files) {
    formData.append("file", file);
  }

  formData.append("path", path);

  return request(
    "/api/upload",
    { method: "POST", body: formData },
    "Could not upload the files."
  );
}
