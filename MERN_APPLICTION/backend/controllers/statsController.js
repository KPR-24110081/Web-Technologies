const { getStats } = require("../utils/history");
const { getDatabaseState } = require("../config/db");

const UNAVAILABLE_STATS = {
  available: false,
  total: 0,
  file: 0,
  url: 0,
  success: 0,
  failed: 0,
  recent: [],
};

/**
 * GET /api/stats
 * Dashboard numbers straight from MongoDB (no hardcoded values).
 * If MongoDB is offline we return zeros and mark the source as unavailable.
 */
async function dashboardStats(_req, res) {
  if (!getDatabaseState().connected) {
    res.json({
      success: true,
      operation: "stats",
      message: "MongoDB is not connected - statistics unavailable",
      data: { ...UNAVAILABLE_STATS },
    });
    return;
  }

  // The database can still drop between the check above and the query, so
  // degrade gracefully instead of rejecting.
  try {
    const stats = await getStats();
    res.json({
      success: true,
      operation: "stats",
      message: "Dashboard statistics retrieved from MongoDB",
      data: { available: true, ...stats },
    });
  } catch (err) {
    console.error("[stats] Could not read statistics from MongoDB:", err.message);
    res.json({
      success: true,
      operation: "stats",
      message: "MongoDB is not reachable - statistics unavailable",
      data: { ...UNAVAILABLE_STATS },
    });
  }
}

module.exports = { dashboardStats };