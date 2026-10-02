const fileService = require("../services/fileService");
const { logOperation } = require("../utils/history");

/**
 * GET /api/files
 * List every entry inside the sandbox storage directory with metadata.
 */
async function listFiles(req, res, next) {
  try {
    const files = await fileService.listFiles();
    await logOperation({
      type: "FILE",
      operation: "LIST",
      method: "fs.readdir",
      status: "success",
      input: "backend/storage",
      result: { count: files.length },
      message: `Listed ${files.length} entrie(s) in storage`,
    });
    res.json({
      success: true,
      operation: "fs.readdir",
      message: "Directory listing retrieved",
      data: { files },
    });
  } catch (err) {
    await logOperation({ type: "FILE", operation: "LIST", status: "error", input: "backend/storage", error: err.message });
    next(err);
  }
}

/**
 * POST /api/files  { name, content }
 * Create a brand new file. Fails if the file already exists (fs.writeFile with flag "wx").
 */
async function createFile(req, res, next) {
  try {
    const { name, content = "" } = req.body;
    const created = await fileService.createFile(name, content);
    await logOperation({
      type: "FILE",
      operation: "CREATE",
      method: "fs.writeFile (flag: wx)",
      status: "success",
      input: `${created.name}`,
      result: { name: created.name, size: created.size },
      message: `Created file "${created.name}"`,
    });
    res.status(201).json({
      success: true,
      operation: "fs.writeFile (flag: wx)",
      message: "File created successfully",
      data: { file: created },
    });
  } catch (err) {
    await logOperation({ type: "FILE", operation: "CREATE", status: "error", input: req.body.name, error: err.message });
    next(err);
  }
}

/**
 * GET /api/files/:name
 * Read the full contents of a file as UTF-8 text.
 */
async function readFile(req, res, next) {
  try {
    const { name } = req.params;
    const result = await fileService.readFile(name);
    await logOperation({
      type: "FILE",
      operation: "READ",
      method: "fs.readFile (utf8)",
      status: "success",
      input: name,
      result: { name: result.name, size: result.size },
      message: `Read file "${name}"`,
    });
    res.json({
      success: true,
      operation: "fs.readFile (utf8)",
      message: "File read successfully",
      data: result,
    });
  } catch (err) {
    await logOperation({ type: "FILE", operation: "READ", status: "error", input: req.params.name, error: err.message });
    next(err);
  }
}

/**
 * PUT /api/files/:name  { content }
 * Overwrite (or create) a file. Uses the default "w" flag.
 */
async function overwriteFile(req, res, next) {
  try {
    const { name } = req.params;
    const { content = "" } = req.body;
    const result = await fileService.writeFile(name, content);
    await logOperation({
      type: "FILE",
      operation: "WRITE",
      method: "fs.writeFile (flag: w)",
      status: "success",
      input: name,
      result: { name: result.name, size: result.size },
      message: `Overwrote file "${name}"`,
    });
    res.json({
      success: true,
      operation: "fs.writeFile (flag: w)",
      message: "File written successfully",
      data: result,
    });
  } catch (err) {
    await logOperation({ type: "FILE", operation: "WRITE", status: "error", input: req.params.name, error: err.message });
    next(err);
  }
}

/**
 * POST /api/files/:name/append  { content }
 * Append content to a file (fs.appendFile).
 */
async function appendToFile(req, res, next) {
  try {
    const { name } = req.params;
    const { content = "" } = req.body;
    const result = await fileService.appendFile(name, content);
    await logOperation({
      type: "FILE",
      operation: "APPEND",
      method: "fs.appendFile",
      status: "success",
      input: name,
      result: { name: result.name, existed: result.existed },
      message: `Appended to "${name}"`,
    });
    res.json({
      success: true,
      operation: "fs.appendFile",
      message: "Content appended successfully",
      data: result,
    });
  } catch (err) {
    await logOperation({ type: "FILE", operation: "APPEND", status: "error", input: req.params.name, error: err.message });
    next(err);
  }
}

/**
 * PATCH /api/files/:name/rename  { newName }
 * Rename an existing file (fs.rename).
 */
async function renameFile(req, res, next) {
  try {
    const { name } = req.params;
    const { newName } = req.body;
    const result = await fileService.renameFile(name, newName);
    await logOperation({
      type: "FILE",
      operation: "RENAME",
      method: "fs.rename",
      status: "success",
      input: `${name} -> ${newName}`,
      result: { oldName: result.oldName, newName: result.newName },
      message: `Renamed "${name}" -> "${newName}"`,
    });
    res.json({
      success: true,
      operation: "fs.rename",
      message: "File renamed successfully",
      data: result,
    });
  } catch (err) {
    await logOperation({ type: "FILE", operation: "RENAME", status: "error", input: req.params.name, error: err.message });
    next(err);
  }
}

/**
 * DELETE /api/files/:name
 * Remove a file (fs.unlink). Only allowed inside the storage sandbox.
 */
async function deleteFile(req, res, next) {
  try {
    const { name } = req.params;
    const result = await fileService.deleteFile(name);
    await logOperation({
      type: "FILE",
      operation: "DELETE",
      method: "fs.unlink",
      status: "success",
      input: name,
      result: { name: result.name },
      message: `Deleted file "${name}"`,
    });
    res.json({
      success: true,
      operation: "fs.unlink",
      message: "File deleted successfully",
      data: result,
    });
  } catch (err) {
    await logOperation({ type: "FILE", operation: "DELETE", status: "error", input: req.params.name, error: err.message });
    next(err);
  }
}

/**
 * GET /api/files/:name/stats
 * Return detailed metadata using fs.stat.
 */
async function fileStats(req, res, next) {
  try {
    const { name } = req.params;
    const result = await fileService.getStats(name);
    await logOperation({
      type: "FILE",
      operation: "STATS",
      method: "fs.stat",
      status: "success",
      input: name,
      result: { name: result.name, size: result.size, isFile: result.isFile },
      message: `Read metadata for "${name}"`,
    });
    res.json({
      success: true,
      operation: "fs.stat",
      message: "File metadata retrieved",
      data: result,
    });
  } catch (err) {
    await logOperation({ type: "FILE", operation: "STATS", status: "error", input: req.params.name, error: err.message });
    next(err);
  }
}

module.exports = {
  listFiles,
  createFile,
  readFile,
  overwriteFile,
  appendToFile,
  renameFile,
  deleteFile,
  fileStats,
};