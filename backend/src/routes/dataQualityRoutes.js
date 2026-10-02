const express = require("express");
const c = require("../controllers/dataQualityController");
const router = express.Router();
router.get("/", c.getDataQuality);
module.exports = router;
