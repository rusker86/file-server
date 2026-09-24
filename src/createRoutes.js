import * as handlers from "./handlersRoutes.js";

function createRoutes(app) {
  app.get("/api/files/", handlers.rootHandler);
  app.get("/api/files/{*splat}", handlers.rootHandler);
  app.get("/api/download/{*splat}", handlers.downloadHandler);
  app.get("/api/health", handlers.healthHandler);
}
export default createRoutes;
