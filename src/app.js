import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import apiRoutes from "./routes/api.routes.js";

const publicDir = fileURLToPath(new URL("../public", import.meta.url));

export function createApp({ root }) {
  const app = express();

  app.locals.root = path.resolve(root);

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(publicDir));
  app.use("/api", apiRoutes);

  app.use("/api", (req, res) => {
    res.status(404).json({ message: "Not found." });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((error, req, res, next) => {
    console.error(error);
    res.status(error.status ?? 500).json({
      message: error.message || "Internal server error.",
    });
  });

  return app;
}
