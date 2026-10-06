import { copyFile, mkdir, readdir, rm, stat, unlink, rename} from "node:fs/promises";
import path from "node:path";
import { PathError, isValidName, resolveInsideRoot } from "../utils/paths.js";

function sendFsError(res, error, fallbackMessage) {
  if (error instanceof PathError) {
    return res.status(error.status).json({ message: error.message });
  }

  const byCode = {
    ENOENT: [404, "File or folder not found."],
    ENOTDIR: [400, "The path is not a folder."],
    EEXIST: [409, "A file or folder with that name already exists."],
    EACCES: [403, "Permission denied."],
    EPERM: [403, "Permission denied."],
  };

  const [status, message] = byCode[error.code] ?? [500, fallbackMessage];

  if (status === 500) {
    console.error(error);
  }

  return res.status(status).json({ message });
}

function splatToPath(splat) {
  return (splat ?? []).join("/");
}

// multer decodes multipart filenames as latin1
function decodeFileName(name) {
  return Buffer.from(name, "latin1").toString("utf8");
}

export async function listFiles(req, res) {
  const { root } = req.app.locals;

  try {
    const fullPath = resolveInsideRoot(root, splatToPath(req.params.splat));
    const entries = await readdir(fullPath, { withFileTypes: true });

    const files = entries
      .map(entry => {
        const isDirectory = entry.isDirectory();

        return {
          name: isDirectory ? "/" + entry.name : entry.name,
          type: isDirectory ? "isDirectory" : "isFile",
        };
      })
      .sort((a, b) =>
        a.type === b.type
          ? a.name.localeCompare(b.name)
          : a.type === "isDirectory" ? -1 : 1
      );

    res.json({ files });
  } catch (error) {
    sendFsError(res, error, "Could not read the folder.");
  }
}

export async function downloadFile(req, res) {
  const { root } = req.app.locals;

  try {
    const fullPath = resolveInsideRoot(root, splatToPath(req.params.splat));
    const stats = await stat(fullPath);

    if (!stats.isFile()) {
      return res.status(404).json({ message: "File not found." });
    }

    res.download(fullPath);
  } catch (error) {
    sendFsError(res, error, "Could not download the file.");
  }
}

export async function uploadFiles(req, res) {
  const { root } = req.app.locals;
  const files = req.files ?? [];

  if (files.length === 0) {
    return res.status(400).json({ message: "No file uploaded." });
  }

  try {
    const folder = resolveInsideRoot(root, req.body.path);
    await mkdir(folder, { recursive: true });

    const uploaded = [];

    for (const file of files) {
      const name = decodeFileName(file.originalname);

      if (!isValidName(name)) {
        throw new PathError(`Invalid file name: ${name}`);
      }

      await copyFile(file.path, path.join(folder, name));
      uploaded.push(name);
    }

    res.json({ message: "Files uploaded successfully.", files: uploaded });
  } catch (error) {
    sendFsError(res, error, "Could not upload the files.");
  } finally {
    await Promise.all(files.map(file => unlink(file.path).catch(() => {})));
  }
}

export async function createFolder(req, res) {
  const { root } = req.app.locals;
  const name = req.body?.name?.trim();

  if (!name) {
    return res.status(400).json({ message: "Folder name is required." });
  }

  if (!isValidName(name)) {
    return res.status(400).json({ message: "The folder name is not valid." });
  }

  try {
    const parent = resolveInsideRoot(root, req.body.path);
    await mkdir(path.join(parent, name));

    res.status(201).json({ message: "Folder created successfully.", name });
  } catch (error) {
    sendFsError(res, error, "Could not create the folder.");
  }
}

export async function deleteFiles(req, res) {
  const { root } = req.app.locals;
  const paths = req.body?.files;

  if (!Array.isArray(paths) || paths.length === 0) {
    return res.status(400).json({ message: "No files to delete." });
  }

  try {
    const fullPaths = paths.map(p => resolveInsideRoot(root, p));

    if (fullPaths.includes(root)) {
      throw new PathError("The shared folder itself cannot be deleted.", 403);
    }

    for (const fullPath of fullPaths) {
      await rm(fullPath, { recursive: true });
    }

    res.json({ message: "Deleted successfully.", deleted: paths.length });
  } catch (error) {
    sendFsError(res, error, "Could not delete the selected items.");
  }
}

export async function moveFiles(req, res) {
  const files = req.body?.files;
  const destination = req.body?.destination;
  const { root } = req.app.locals;

  if (!Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ message: "No files to move." });
  }

  try {

    const fullPaths = files.map(p => resolveInsideRoot(root, p))
    const fullPathDestination = resolveInsideRoot(root, destination);

    if (fullPaths.includes(root)) {
      throw new PathError("The folder itself cannot be moved", 403)
    }


    for (const fullPath of fullPaths) {
      let nameFile = fullPath.split("/")
      nameFile = nameFile[nameFile.length - 1]

      await rename(fullPath, fullPathDestination.concat("/" + nameFile), error => {
        if (error) {
          return res.status(403).json({ message: "The folder itself cannot be moved" });
        }
        return res.status(403).json({ message: "Files moved successfully", moved: files.length });
      })
    }

    res.json({ message: "Moved successfully.", moved: files.length });
  } catch (error) {
    sendFsError(res, error, "Could not move the selected items.");
  }
}

export function health(req, res) {
  res.json({ message: "OK" });
}
