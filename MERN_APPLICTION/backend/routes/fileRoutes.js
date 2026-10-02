const express = require("express");
const router = express.Router();

const {
  listFiles,
  createFile,
  readFile,
  overwriteFile,
  appendToFile,
  renameFile,
  deleteFile,
  fileStats,
} = require("../controllers/fileController");

// List directory contents
router.get("/", listFiles);

// Create a new file
router.post("/", createFile);

// Read a file
router.get("/:name", readFile);

// Overwrite a file
router.put("/:name", overwriteFile);

// Append to a file
router.post("/:name/append", appendToFile);

// Rename a file
router.patch("/:name/rename", renameFile);

// Delete a file
router.delete("/:name", deleteFile);

// File metadata
router.get("/:name/stats", fileStats);

module.exports = router;