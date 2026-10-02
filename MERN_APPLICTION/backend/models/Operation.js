const mongoose = require("mongoose");

/**
 * Operation
 * ---------
 * Persistent record of every file-system / URL operation executed through
 * the API. Stored in the "operations" collection of the "nodescope" database.
 *
 * Fields:
 *  - type      : "FILE" | "URL"
 *  - operation : semantic op name (CREATE, READ, WRITE, APPEND, RENAME,
 *                DELETE, LIST, STATS | PARSE, PARAMS, VALIDATE, MODIFY,
 *                BUILD, RESOLVE)
 *  - method    : the actual Node.js API that ran (fs.writeFile, new URL(), ...)
 *  - input     : the user-supplied input as a string
 *  - result    : the JSON result returned to the client
 *  - status    : "success" | "error"
 *  - error     : message describing a failure (empty on success)
 */
const operationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["FILE", "URL"],
      index: true,
    },
    operation: {
      type: String,
      required: true,
      index: true,
    },
    method: {
      type: String,
      default: "",
    },
    input: {
      type: String,
      default: "",
    },
    result: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    status: {
      type: String,
      required: true,
      default: "success",
      enum: ["success", "error"],
      index: true,
    },
    error: {
      type: String,
      default: "",
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model("Operation", operationSchema);