import { argv } from "node:process";
import {
  readdirSync,
  statSync,
  mkdirSync,
  copyFileSync,
  unlinkSync,
} from "node:fs";

function rootHandler(req, res) {
  const folder = argv[2];
  const path = (req.params.splat || []).join("/");
  const fullPath = folder + "/" + path;
  const files = readdirSync(fullPath);

  const result = {
    files: files.map(file => ({
      name: statSync(fullPath + "/" + file).isDirectory()
        ? "/" + file
        : file,
      type: statSync(fullPath + "/" + file).isDirectory()
        ? "isDirectory"
        : "isFile",
    })),
  }


  console.log("Folder:", folder);
  console.log("Path:", path);
  console.log("Full path:", fullPath);
  console.log("Files:", files);


  res.json(result);
}

function downloadHandler(req, res) {
  const folder = argv[2];
  const path = req.params.splat.join("/");
  const fullPath = folder + "/" + path;

  const stats = statSync(fullPath);

  if (!stats.isFile()) {
    return res.status(404).json({ message: 'File not found' });
  }

  res.download(fullPath);
}


function uploadHandler(req, res) {
  const file = req.file;

  if (!file) {
    return res.status(400).json({
      message: "No file uploaded"
    });
  }

  const folder = argv[2];
  const path = req.body.path || "";

  const fullPath = folder + path;
  const destination = fullPath + "/" + file.originalname;

  mkdirSync(fullPath, {
    recursive: true
  });

  copyFileSync(file.path, destination);
  unlinkSync(file.path);

  res.json({
    message: "File uploaded successfully",
    file: file.originalname
  });
}


function createFolderHandler(req, res) {
  const folder = argv[2];
  const path = req.body.path || "";
  const name = req.body.name;

  if (!name) {
    return res.status(400).json({
      message: "Folder name is required"
    });
  }

  const fullPath = folder + path + "/" + name;

  try {
    mkdirSync(fullPath);

    res.status(201).json({
      message: "Folder created successfully",
      name
    });

  } catch (error) {
    if (error.code === "EEXIST") {
      return res.status(409).json({
        message: "A folder with that name already exists."
      });
    }

    console.error(error);

    return res.status(500).json({
      message: "Could not create the folder."
    });
  }
}

function healthHandler(req, res) {
  res.json({ message: 'OK' });
}

function serverFront(req, res) {
  res.sendFile(__dirname + "/index.html");
}

export {
  rootHandler,
  healthHandler,
  downloadHandler,
  serverFront,
  uploadHandler,
  createFolderHandler
};
