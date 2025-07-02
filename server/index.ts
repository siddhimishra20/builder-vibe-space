import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleNewsProxy } from "./routes/news";
import { handleWebhookTest } from "./routes/webhook-test";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    res.json({ message: "Hello from Express server v2!" });
  });

  app.get("/api/demo", handleDemo);
  app.get("/api/news", handleNewsProxy);
  app.get("/api/webhook-test", handleWebhookTest);

  return app;
}
