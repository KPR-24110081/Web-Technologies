const express = require("express");
const router = express.Router();

const { listHistory, clear } = require("../controllers/historyController");

router.get("/", listHistory);
router.delete("/", clear);

module.exports = router;