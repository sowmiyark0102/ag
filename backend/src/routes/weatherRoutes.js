const express = require("express");
const c = require("../controllers/weatherController");
const router = express.Router();
router.get("/forecast", c.getForecast);
router.get("/history", c.getHistory);
router.get("/rain-memory", c.getRainMemory);
module.exports = router;
