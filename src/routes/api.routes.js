import { Router } from "express";
import multer from "multer";
import os from "node:os";
import path from "node:path";
import * as files from "../controllers/files.controller.js";

const upload = multer({ dest: path.join(os.tmpdir(), "file-server-uploads") });

const router = Router();

router.get("/health", files.health);

router.get("/files", files.listFiles);
router.get("/files/{*splat}", files.listFiles);
router.delete("/files", files.deleteFiles);

router.get("/download/{*splat}", files.downloadFile);
router.post("/upload", upload.array("file"), files.uploadFiles);
router.post("/folders", files.createFolder);

router.post("/move", files.moveFiles)

export default router;
