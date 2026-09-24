import * as server from "./server.js";
import createRoutes from "./createRoutes.js";
import { argv } from "node:process";

const app = server.createServer();

if (argv.length < 3) {
  console.error("Usage: node index.js <folder-to-serve>");
  process.exit(1);
}

createRoutes(app);
server.startServer(app);
