import express from "express";
import bodyParser from "body-parser";

function createServer() {
  const app = express();
  app.use(bodyParser.json());
  app.use(express.urlencoded({ extended: true }));
  return app
}

function startServer(app) {
  app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
  });
}

export { createServer, startServer };
