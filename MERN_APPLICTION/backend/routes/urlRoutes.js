const express = require("express");
const router = express.Router();

const {
  parseUrl,
  validateUrl,
  getParams,
  modifyUrl,
  buildUrl,
  resolveUrl,
} = require("../controllers/urlController");

router.post("/parse", parseUrl);
router.post("/validate", validateUrl);
router.post("/params", getParams);
router.post("/modify", modifyUrl);
router.post("/build", buildUrl);
router.post("/resolve", resolveUrl);

module.exports = router;