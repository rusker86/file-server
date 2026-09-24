import { argv } from "node:process";
import { readdirSync, statSync } from "node:fs";


function rootHandler(req, res) {
  const folder = argv[2];
  const files = readdirSync(folder);

  res.json({
    files: files.map(file => ({ name: statSync(folder + "/" + file).isDirectory() ? "/" + file : file }))
  });
}

function downloadHandler(req, res) {
  const { name } = req.params;
  const folder = argv[2];
  console.log(name)
  const filePath = folder + "/" + name;

  res.download(filePath);
}

function healthHandler(req, res) {
  res.json({ message: 'OK' });
}

export { rootHandler, healthHandler, downloadHandler };
