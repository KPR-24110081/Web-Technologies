const path = require("path");
const { HttpError } = require("./errors");

// The only place file operations are allowed to touch.
const STORAGE_DIR = path.resolve(__dirname, "..", "storage");

// Characters that would break a single, flat filename.
// We intentionally forbid path separators and anything that could hide a path.
const UNSAFE = /[\\/]|\.\./;

const VALID_NAME = /^[A-Za-z0-9][A-Za-z0-9._()@^$!#%&+,;=\- ]{0,254}$/;

/**
 * Validate a raw user-supplied filename.
 * - must be a non-empty string
 * - must not contain path separators or ".."
 * - must not contain null bytes
 * - length capped at 255 chars
 */
function validateFilename(name) {
  if (typeof name !== "string") {
    throw new HttpError("Filename must be a string.", 400);
  }
  const trimmed = name.trim();
  if (!trimmed) {
    throw new HttpError("Filename cannot be empty.", 400);
  }
  if (UNSAFE.test(trimmed)) {
    throw new HttpError("Invalid filename: path separators ('/' or '\\\\') and '..' are not allowed.", 400);
  }
  if (trimmed.includes("\0")) {
    throw new HttpError("Invalid filename: contains a null character.", 400);
  }
  if (trimmed.length > 255) {
    throw new HttpError("Filename is too long (max 255 characters).", 400);
  }
  if (!VALID_NAME.test(trimmed)) {
    throw new HttpError("Invalid filename. Only letters, numbers, spaces, dots, dashes and underscores are allowed.", 400);
  }
  return trimmed;
}

/**
 * Reject anything that looks like a nested path (leftover defense).
 */
function isNestedPath(name) {
  return typeof name === "string" && (name.includes("/") || name.includes("\\"));
}

/**
 * Resolve a filename to an absolute path inside the storage sandbox.
 * Returns { safe, fullPath } after verifying the final path stays inside storage.
 */
function resolveSafePath(name) {
  const safe = validateFilename(name);
  const fullPath = path.resolve(STORAGE_DIR, safe);

  // Defense in depth: the resolved path MUST remain inside the storage directory.
  const insideStorage = fullPath === STORAGE_DIR || fullPath.startsWith(STORAGE_DIR + path.sep);
  if (!insideStorage) {
    throw new HttpError("Path escapes the storage directory.", 400);
  }
  return { safe, fullPath };
}

module.exports = { STORAGE_DIR, validateFilename, isNestedPath, resolveSafePath };