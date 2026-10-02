const { getDatabaseState } = require("../config/db");

/**
 * GET /api/health
 * Reports server + MongoDB status so the frontend can show a live indicator.
 */
async function getHealth(_req, res) {
  const db = getDatabaseState();
  const dbLabel = db.connected ? "connected" : "disconnected";

  res.json({
    success: true,
    server: "running",
    database: dbLabel,
    dbState: db.state,
    message: `Server is running. MongoDB is ${db.state}.`,
    timestamp: new Date().toISOString(),
    data: {
      app: "NodeScope API",
      node: process.version,
      uptime: Math.round(process.uptime()),
    },
  });
}

module.exports = { getHealth };