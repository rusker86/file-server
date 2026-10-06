// Paths are stored as "" (root) or "/a/b" (no trailing slash).
export const state = {
  currentPath: "",
};

export function joinPath(base, name) {
  const cleanBase = base.replace(/\/+$/, "");
  const cleanName = name.replace(/^\/+/, "");

  return `${cleanBase}/${cleanName}`;
}

export function parentPath(path) {
  const parts = path.split("/").filter(Boolean);

  parts.pop();

  return parts.length > 0 ? "/" + parts.join("/") : "";
}

export function displayName(file) {
  return file.name.replace(/^\//, "");
}

export function isDirectory(file) {
  return file.type === "isDirectory";
}
