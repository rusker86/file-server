import * as handlers from "./handlersRoutes.js";
import multer from "multer";

const upload = multer({ dest: "tmp/uploads" });

function createRoutes(app) {
  app.get("/api/files/", handlers.rootHandler);
  app.get("/api/files/{*splat}", handlers.rootHandler);
  app.get("/api/download/{*splat}", handlers.downloadHandler);
  app.post("/api/upload/", upload.single("file"), handlers.uploadHandler);
  app.post("/api/folders/", handlers.createFolderHandler);
  app.get("/api/health", handlers.healthHandler);
}
export default createRoutes;
