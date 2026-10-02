require("dotenv").config();

const { createApp } = require("./app");
const { connectDB } = require("./config/db");

const PORT = process.env.PORT || 5000;

/**
 * Entry point: connect to MongoDB first, then start listening.
 * MongoDB failure is non-fatal — the API stays up (health reports it).
 */

// A dropped database connection or a stray rejection must not take the whole
// API down: log it and keep serving. Node would otherwise exit on an
// unhandled rejection (Express 4 does not catch async handler rejections).
process.on("unhandledRejection", (reason) => {
  console.error("[unhandledRejection]", reason);
});

process.on("uncaughtException", (err) => {
  console.error("[uncaughtException]", err);
});

async function start() {
  await connectDB();

  const app = createApp();
  app.listen(PORT, () => {
    console.log(`\n  NodeScope backend running        ->  http://localhost:${PORT}`);
    console.log(`  Health check                    ->  http://localhost:${PORT}/api/health`);
    console.log(`  API base                        ->  http://localhost:${PORT}/api\n`);
  });
}

start();

module.exports = { createApp };