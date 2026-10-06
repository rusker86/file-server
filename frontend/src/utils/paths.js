export function joinPath(base, name) {
  const cleanBase = base.replace(/\/+$/, "");
  const cleanName = name.replace(/^\/+/, "");
  return `${cleanBase}/${cleanName}`;
}

export function parentPath(path) {
  const parts = path.split("/").filter(Boolean);
  parts.pop();
  return parts.length ? `/${parts.join("/")}` : "";
}

export function displayName(file) {
  return file.name.replace(/^\//, "");
}

export function isDirectory(file) {
  return file.type === "isDirectory";
}

export function canMoveTo(destination, sources) {
  if (!sources.length) {
    return false;
  }

  const normalizedDestination = destination.replace(/\/+$/, "");
  return sources.every(source => {
    const normalizedSource = source.replace(/\/+$/, "");
    return normalizedSource !== normalizedDestination &&
      !normalizedDestination.startsWith(`${normalizedSource}/`);
  });
}