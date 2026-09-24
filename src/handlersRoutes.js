import { argv } from "node:process";
import { readdirSync, statSync } from "node:fs";
import { type } from "node:os";

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

function healthHandler(req, res) {
  res.json({ message: 'OK' });
}

function serverFront(req, res) {
  res.sendFile(__dirname + "/index.html");
}

export { rootHandler, healthHandler, downloadHandler, serverFront };
