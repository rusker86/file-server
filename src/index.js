import { statSync } from "node:fs";
import { argv, env, exit } from "node:process";
import { createApp } from "./app.js";

const root = argv[2];
const port = Number(env.PORT) || 3000;

if (!root) {
  console.error("Usage: node src/index.js <folder-to-serve>");
  exit(1);
}

if (!statSync(root, { throwIfNoEntry: false })?.isDirectory()) {
  console.error(`Error: "${root}" is not a directory.`);
  exit(1);
}

const app = createApp({ root });

app.listen(port, () => {
  console.log(`Serving ${app.locals.root}`);
  console.log(`Server is running on http://localhost:${port}`);
});
