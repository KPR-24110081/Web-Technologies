const mongoose = require("mongoose");

// Connection string comes from the environment. The default points at a
// local MongoDB instance with a database named "nodescope".
const DATABASE_URL =
  process.env.MONGODB_URI || "mongodb://localhost:27017/nodescope";

// How often to retry while MongoDB is unavailable.
const RETRY_INTERVAL_MS = 5000;

let retryTimer = null;

const CONNECT_OPTIONS = {
  serverSelectionTimeoutMS: 5000,
  // Fail queries fast instead of letting Mongoose buffer them for 10s, so a
  // dead database returns a 503 promptly rather than hanging the request.
  bufferTimeoutMS: 3000,
};

/**
 * Keep retrying in the background until MongoDB answers, so the order in
 * which you start MongoDB and the API does not matter.
 */
function scheduleReconnect() {
  if (retryTimer) return;
  retryTimer = setInterval(async () => {
    if (mongoose.connection.readyState === 1) {
      clearInterval(retryTimer);
      retryTimer = null;
      return;
    }
    try {
      await mongoose.connect(DATABASE_URL, CONNECT_OPTIONS);
      const { host, name } = mongoose.connection;
      console.log(`\n  MongoDB connected  ->  mongodb://${host}/${name}`);
      clearInterval(retryTimer);
      retryTimer = null;
    } catch {
      // Still unavailable — the next tick tries again.
    }
  }, RETRY_INTERVAL_MS);
  // Do not hold the event loop open just for the retry timer.
  retryTimer.unref?.();
}

/**
 * Connect to MongoDB using Mongoose.
 * Handles errors gracefully: on failure the server keeps running so the
 * file-system / URL labs still work, and it retries until MongoDB comes up.
 */
async function connectDB() {
  try {
    await mongoose.connect(DATABASE_URL, CONNECT_OPTIONS);
    const { host, name } = mongoose.connection;
    console.log(`\n  MongoDB connected  ->  mongodb://${host}/${name}`);
  } catch (err) {
    console.error("\n  MongoDB connection failed:", err.message);
    console.error("  The API will still run, but history/stats need MongoDB.");
    console.error("  Retrying every 5s until MongoDB is available...\n");
    scheduleReconnect();
  }
  return mongoose.connection;
}

/**
 * Current MongoDB connection state as a printable + boolean pair.
 * readyState: 0 disconnected, 1 connected, 2 connecting, 3 disconnecting.
 */
function getDatabaseState() {
  const state = mongoose.connection.readyState;
  const labels = ["disconnected", "connected", "connecting", "disconnecting"];
  return {
    state: labels[state] || "unknown",
    connected: state === 1,
  };
}

module.exports = { connectDB, getDatabaseState };