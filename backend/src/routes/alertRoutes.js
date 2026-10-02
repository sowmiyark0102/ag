const express = require("express");
const c = require("../controllers/alertController");
const router = express.Router();
router.get("/", c.listAlerts);
module.exports = router;
