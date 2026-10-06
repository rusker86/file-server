import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createAuth } from "./auth.js";
import { createApiRoutes } from "./routes/api.routes.js";

const distDir = fileURLToPath(new URL("../dist", import.meta.url));

export function createApp({ root, dataDirectory }) {
  const app = express();

  app.locals.root = path.resolve(root);
  const auth = createAuth({ root: app.locals.root, dataDirectory });
  app.locals.auth = auth;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(auth.loadSession);
  app.use("/api", createApiRoutes(auth));

  app.use("/api", (req, res) => {
    res.status(404).json({ message: "Not found." });
  });

  const serveFileBrowser = (req, res) => {
    if (!req.user) {
      return res.redirect("/login.html");
    }

    res.sendFile(path.join(distDir, "index.html"));
  };

  app.get(["/", "/index.html"], serveFileBrowser);
  app.get(["/login.html", "/register.html"], (req, res) => {
    if (req.user) {
      return res.redirect("/");
    }

    res.sendFile(path.join(distDir, "index.html"));
  });

  app.use(express.static(distDir, { index: false }));

  // eslint-disable-next-line no-unused-vars
  app.use((error, req, res, next) => {
    console.error(error);
    res.status(error.status ?? 500).json({
      message: error.message || "Internal server error.",
    });
  });

  return app;
}
