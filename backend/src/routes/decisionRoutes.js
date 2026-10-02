const express = require("express");
const router = express.Router();
const decisionController = require("../controllers/decisionController");

router.get("/should-i-farm-today", decisionController.shouldIFarmToday);
router.get("/activity-window", decisionController.activityWindow);

module.exports = router;
