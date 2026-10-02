const express = require("express");
const router = express.Router();

const { dashboardStats } = require("../controllers/statsController");

router.get("/", dashboardStats);

module.exports = router;