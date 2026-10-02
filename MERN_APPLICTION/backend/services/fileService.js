const fsp = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const { HttpError } = require("../utils/errors");
const { validateFilename, isNestedPath, resolveSafePath, STORAGE_DIR } = require("../utils/safePath");

/**
 * Format a raw fs.Stats object into a JSON-friendly shape.
 */
function formatStats(name, stats) {
  return {
    name,
    size: stats.size,
    sizeLabel: formatBytes(stats.size),
    birthtime: stats.birthtime.toISOString(),
    mtime: stats.mtime.toISOString(),
    isFile: stats.isFile(),
    isDirectory: stats.isDirectory(),
  };
}

/**
 * Human readable byte size ("1.2 KB", "300 B").
 */
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * List all entries in the storage directory, sorted by name.
 * Uses fs.readdir + fs.stat to build a rich listing.
 */
async function listFiles() {
  const entries = await fsp.readdir(STORAGE_DIR, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(STORAGE_DIR, entry.name);
    let stats;
    try {
      stats = await fsp.stat(fullPath);
    } catch {
      continue;
    }
    files.push({
      id: crypto.createHash("sha1").update(entry.name).digest("hex").slice(0, 12),
      name: entry.name,
      type: entry.isDirectory() ? "directory" : extensionLabel(entry.name),
      extension: path.extname(entry.name).slice(1).toLowerCase(),
      size: stats.size,
      sizeLabel: formatBytes(stats.size),
      modified: stats.mtime.toISOString(),
      modifiedLabel: new Date(stats.mtime).toLocaleString(),
      ...formatStats(entry.name, stats),
    });
  }

  return files.sort((a, b) => a.name.localeCompare(b.name));
}

function extensionLabel(name) {
  const ext = path.extname(name).slice(1);
  return ext ? `${ext.toUpperCase()} file` : "file";
}

/**
 * Create a new file. Uses flag "wx" so it FAILS if the file already exists.
 */
async function createFile(name, content) {
  const { safe, fullPath } = resolveSafePath(name);

  // Reject nested paths up front (defense in depth).
  if (isNestedPath(name)) {
    throw new HttpError("Creating files inside folders is not supported.", 400);
  }

  try {
    await fsp.writeFile(fullPath, String(content ?? ""), { encoding: "utf8", flag: "wx" });
  } catch (err) {
    if (err.code === "EEXIST") {
      throw new HttpError(`File "${safe}" already exists. Use Overwrite to replace it.`, 409);
    }
    throw err;
  }

  const stats = await fsp.stat(fullPath);
  return { name: safe, ...formatStats(safe, stats) };
}

/**
 * Read a file's UTF-8 text content plus its size.
 */
async function readFile(name) {
  const { safe, fullPath } = resolveSafePath(name);
  try {
    const content = await fsp.readFile(fullPath, "utf8");
    const stats = await fsp.stat(fullPath);
    return { name: safe, content, ...formatStats(safe, stats) };
  } catch (err) {
    if (err.code === "ENOENT") throw new HttpError(`File "${safe}" not found.`, 404);
    throw err;
  }
}

/**
 * Write/overwrite a file. Default "w" flag creates the file if missing
 * and replaces the content if present.
 */
async function writeFile(name, content) {
  const { safe, fullPath } = resolveSafePath(name);
  if (isNestedPath(name)) throw new HttpError("Writing into folders is not supported.", 400);

  try {
    await fsp.writeFile(fullPath, String(content ?? ""), { encoding: "utf8", flag: "w" });
  } catch (err) {
    if (err.code === "ENOENT") throw new HttpError(`File "${safe}" not found.`, 404);
    throw err;
  }

  const stats = await fsp.stat(fullPath);
  return { name: safe, ...formatStats(safe, stats) };
}

/**
 * Append content to a file. fs.appendFile creates the file if it does not exist.
 */
async function appendFile(name, content) {
  const { safe, fullPath } = resolveSafePath(name);
  const text = String(content ?? "");

  let existed = true;
  try {
    await fsp.access(fullPath);
  } catch {
    existed = false;
  }

  try {
    await fsp.appendFile(fullPath, text, "utf8");
  } catch (err) {
    if (err.code === "ENOENT") throw new HttpError(`File "${safe}" not found.`, 404);
    throw err;
  }

  const stats = await fsp.stat(fullPath);
  return { name: safe, existed, ...formatStats(safe, stats) };
}

/**
 * Rename (move) a file within the storage directory.
 */
async function renameFile(oldName, newName) {
  const oldPath = resolveSafePath(oldName);
  const newPath = resolveSafePath(newName);

  if (oldPath.safe === newPath.safe) {
    throw new HttpError("New name must be different from the current name.", 400);
  }

  try {
    await fsp.access(newPath.fullPath);
    throw new HttpError(`File "${newPath.safe}" already exists.`, 409);
  } catch (err) {
    if (err instanceof HttpError) throw err;
    // ENOENT is expected - the new name must be free.
  }

  try {
    await fsp.rename(oldPath.fullPath, newPath.fullPath);
  } catch (err) {
    if (err.code === "ENOENT") throw new HttpError(`File "${oldPath.safe}" not found.`, 404);
    throw err;
  }

  return { oldName: oldPath.safe, newName: newPath.safe };
}

/**
 * Delete a file using fs.unlink. ResolveSafePath guarantees it stays in storage.
 */
async function deleteFile(name) {
  const { safe, fullPath } = resolveSafePath(name);
  try {
    await fsp.unlink(fullPath);
  } catch (err) {
    if (err.code === "ENOENT") throw new HttpError(`File "${safe}" not found.`, 404);
    throw err;
  }
  return { name: safe };
}

/**
 * Return full metadata for a single file.
 */
async function getStats(name) {
  const { safe, fullPath } = resolveSafePath(name);
  let stats;
  try {
    stats = await fsp.stat(fullPath);
  } catch (err) {
    if (err.code === "ENOENT") throw new HttpError(`File "${safe}" not found.`, 404);
    throw err;
  }

  return {
    absolutePath: fullPath,
    safePath: `storage/${safe}`,
    extension: path.extname(safe).slice(1).toLowerCase(),
    ...formatStats(safe, stats),
  };
}

module.exports = {
  listFiles,
  createFile,
  readFile,
  writeFile,
  appendFile,
  renameFile,
  deleteFile,
  getStats,
  formatBytes,
  validateFilename,
};