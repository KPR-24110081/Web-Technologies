const Operation = require("../models/Operation");
const { clearHistory } = require("../utils/history");
const { getDatabaseState } = require("../config/db");
const { dbUnavailable } = require("../utils/errors");

/**
 * GET /api/history?type=FILE&status=success&operation=CREATE&limit=100
 * Query operation records from MongoDB (newest first) with optional filters.
 */
async function listHistory(req, res, next) {
  try {
    if (!getDatabaseState().connected) throw dbUnavailable();

    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 300);
    const { type, status, operation } = req.query;

    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (operation) filter.operation = operation;

    const items = await Operation.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({
      success: true,
      operation: "history.list",
      message: "Operation history retrieved from MongoDB",
      data: {
        items,
        total: items.length,
        filters: { type: filter.type || null, status: filter.status || null, operation: filter.operation || null },
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/history
 * Remove every operation record from MongoDB.
 */
async function clear(_req, res, next) {
  try {
    if (!getDatabaseState().connected) throw dbUnavailable();

    const { deleted } = await clearHistory();
    res.json({
      success: true,
      operation: "history.clear",
      message: `History cleared (${deleted} record(s) removed)`,
      data: { items: [], deleted },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { listHistory, clear };