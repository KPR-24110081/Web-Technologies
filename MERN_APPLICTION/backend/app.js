const express = require("express");
const cors = require("cors");

const fileRoutes = require("./routes/fileRoutes");
const urlRoutes = require("./routes/urlRoutes");
const historyRoutes = require("./routes/historyRoutes");
const statsRoutes = require("./routes/statsRoutes");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");
const { getHealth } = require("./controllers/systemController");

/**
 * Build & configure the Express application (routes, middleware, error handling).
 * Kept separate from server.js so it can be tested without opening a port.
 */
function createApp() {
  const app = express();

  // Enable CORS so the Vite dev server (and static frontend) can call this API.
  app.use(cors({ origin: process.env.CLIENT_URL || "*" }));

  // Parse incoming JSON request bodies.
  app.use(express.json({ limit: "1mb" }));

  // Simple request logger (development friendly).
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
  });

  // Health check - lets the frontend know the backend + DB are alive.
  app.get("/api/health", getHealth);

  // Module route groups.
  app.use("/api/files", fileRoutes);
  app.use("/api/url", urlRoutes);
  app.use("/api/history", historyRoutes);
  app.use("/api/stats", statsRoutes);

  // Fallback for unknown routes.
  app.use(notFoundHandler);

  // Centralized error handler (must be last).
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };