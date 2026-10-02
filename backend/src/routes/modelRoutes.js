const express = require("express");
const router = express.Router();
const verificationController = require("../controllers/verificationController");

router.get("/metrics", verificationController.getModelMetrics);

module.exports = router;
