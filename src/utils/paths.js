import path from "node:path";

export class PathError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export function resolveInsideRoot(root, relativePath = "") {
  const segments = String(relativePath).split(/[\\/]+/).filter(Boolean);
  const resolved = path.resolve(root, ...segments);

  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    throw new PathError("Path is outside of the shared folder.", 403);
  }

  return resolved;
}

export function isValidName(name) {
  return (
    typeof name === "string" &&
    name.trim() !== "" &&
    name !== "." &&
    name !== ".." &&
    !/[\\/\0]/.test(name)
  );
}
