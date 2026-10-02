import { apiRequest } from "./api";

// All these functions talk to the REST API, which reads/writes MongoDB.

/** GET /api/history — optional filters: type, status, operation, limit */
export async function getHistory({ type, status, operation, limit = 100 } = {}) {
  const params = new URLSearchParams();
  if (type) params.set("type", type);
  if (status) params.set("status", status);
  if (operation) params.set("operation", operation);
  if (limit) params.set("limit", limit);

  const qs = params.toString();
  const data = await apiRequest(`/history${qs ? `?${qs}` : ""}`);
  return data.data;
}

/** DELETE /api/history — wipe every operation record */
export async function clearHistory() {
  return apiRequest("/history", { method: "DELETE" });
}

/** GET /api/stats — dashboard aggregates computed from MongoDB */
export async function getStats() {
  const data = await apiRequest("/stats");
  return data.data;
}