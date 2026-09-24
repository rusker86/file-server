import * as handlers from "./handlersRoutes.js";

function createRoutes(app) {
  app.get("/api/contents", handlers.rootHandler);
  app.get("/api/download/:name", handlers.downloadHandler);
  app.get("/api/health", handlers.healthHandler);
}

export default createRoutes;
