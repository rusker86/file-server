import { Router } from "express";
import multer from "multer";
import os from "node:os";
import path from "node:path";
import * as files from "../controllers/files.controller.js";

const upload = multer({ dest: path.join(os.tmpdir(), "file-server-uploads") });

export function createApiRoutes(auth) {
	const router = Router();

	router.post("/auth/register", auth.register);
	router.post("/auth/login", auth.login);
	router.post("/auth/logout", auth.requireAuth, auth.logout);
	router.get("/auth/me", auth.requireAuth, auth.me);
	router.get("/health", files.health);

	router.use(auth.requireAuth);

	router.get("/files", files.listFiles);
	router.get("/files/{*splat}", files.listFiles);
	router.delete("/files", files.deleteFiles);

	router.get("/download/{*splat}", files.downloadFile);
	router.post("/upload", upload.array("file"), files.uploadFiles);
	router.post("/folders", files.createFolder);
	router.post("/move", files.moveFiles);

	return router;
}
