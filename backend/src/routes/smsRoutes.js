const express = require("express");
const router = express.Router();
const smsController = require("../controllers/smsController");

router.post("/simulate", smsController.simulateSms);

module.exports = router;
