/**
 * Small helper error with an HTTP status code.
 * Thrown inside services and translated to JSON by the error handler middleware.
 */
class HttpError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

/**
 * Error thrown by DB-dependent endpoints when MongoDB is unreachable.
 * Translated to HTTP 503 by the error handler instead of crashing the process.
 */
function dbUnavailable() {
  return new HttpError(
    "MongoDB is not connected. Start MongoDB (docker start nodescope-mongo) and try again.",
    503
  );
}

module.exports = { HttpError, dbUnavailable };