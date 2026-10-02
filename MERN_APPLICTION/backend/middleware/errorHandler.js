/**
 * 404 handler for unknown routes.
 */
function notFoundHandler(_req, res) {
  res.status(404).json({
    success: false,
    message: "Route not found on NodeScope API",
  });
}

/**
 * Translate common Mongoose errors into friendly HTTP responses.
 */
function normalizeError(err) {
  // Mongoose validation failure -> 400 with a readable message.
  if (err.name === "ValidationError") {
    const detail = Object.values(err.errors)
      .map((e) => e.message)
      .join("; ");
    return { status: 400, message: `Validation error: ${detail}` };
  }

  // Invalid ObjectId format -> treat as not found / bad request.
  if (err.name === "CastError") {
    return { status: 400, message: `Invalid value for "${err.path}".` };
  }

  // Duplicate key (unique constraint) -> 409.
  if (err.code === 11000) {
    return { status: 409, message: "Duplicate value — that record already exists." };
  }

  return { status: err.status || 500, message: err.message };
}

/**
 * Centralized Express error handler.
 * Sends a friendly JSON error without leaking stacks to clients.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  const normalized = normalizeError(err);
  const status = normalized.status || 500;
  const message = status === 500 ? "Internal server error" : normalized.message;

  if (status === 500) {
    console.error("[server error]", err);
  }

  res.status(status).json({
    success: false,
    operation: err.operation || "unknown",
    message,
    error: message,
    status,
  });
}

module.exports = { notFoundHandler, errorHandler };