const Operation = require("../models/Operation");

// Maps the legacy { module } field ("fs" / "url") to the model's type.
const MODULE_TO_TYPE = { fs: "FILE", url: "URL" };

/**
 * Record an executed operation in MongoDB.
 *
 * Accepted shape (preferred):
 *   { type, operation, method, input, result, status, error }
 *
 * Legacy shape (still supported):
 *   { module: "fs" | "url", operation, status, message }
 *
 * IMPORTANT: this helper is non-fatal. If MongoDB is unavailable the
 * operation itself must still succeed, so failures are logged (not thrown).
 */
async function logOperation(entry = {}) {
  const doc = {
    type: entry.type || MODULE_TO_TYPE[entry.module] || "FILE",
    operation: entry.operation || "EXECUTE",
    method: entry.method || "",
    input: entry.input !== undefined && entry.input !== null ? String(entry.input) : "",
    result: entry.result !== undefined && entry.result !== null ? entry.result : null,
    status: entry.status || "success",
    error: entry.error || entry.message || "",
  };

  try {
    return await Operation.create(doc);
  } catch (err) {
    console.error("[history] Could not persist operation to MongoDB:", err.message);
    return null;
  }
}

/**
 * Delete every operation record (used by the "Clear history" button).
 */
async function clearHistory() {
  const res = await Operation.deleteMany({});
  return { deleted: res.deletedCount || 0 };
}

/**
 * Aggregated counts for the dashboard. Real numbers straight from MongoDB.
 */
async function getStats() {
  const [total, file, url, success, failed] = await Promise.all([
    Operation.countDocuments({}),
    Operation.countDocuments({ type: "FILE" }),
    Operation.countDocuments({ type: "URL" }),
    Operation.countDocuments({ status: "success" }),
    Operation.countDocuments({ status: "error" }),
  ]);

  const recent = await Operation.find({}).sort({ createdAt: -1 }).limit(6).lean();

  return {
    total,
    file,
    url,
    success,
    failed,
    recent: recent.map((r) => ({
      _id: r._id,
      type: r.type,
      operation: r.operation,
      method: r.method,
      status: r.status,
      createdAt: r.createdAt,
    })),
  };
}

module.exports = { logOperation, clearHistory, getStats };