// Base URL for the NodeScope backend.
// Prefer VITE_API_URL; keep VITE_API_BASE as a legacy fallback.
export const API_BASE =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE ||
  "http://localhost:5000/api";

/**
 * Thin fetch wrapper for the NodeScope backend.
 * - attaches JSON body for non-GET requests
 * - parses JSON responses
 * - throws a friendly ApiError when the backend reports failure
 */
export async function apiRequest(path, { method = "GET", body } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(`Cannot reach the backend at ${API_BASE}. Is the Express server running?`, 0);
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // Non-JSON body — wrap it anyway.
  }

  if (!response.ok || (payload && payload.success === false)) {
    throw new ApiError(
      payload?.message || `Request failed with status ${response.status}`,
      response.status,
      payload
    );
  }

  return payload;
}

export class ApiError extends Error {
  constructor(message, status = 0, payload = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

/** Health check used by the navbar for the server + database indicator. */
export async function healthCheck() {
  return apiRequest("/health");
}