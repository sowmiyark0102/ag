const express = require("express");
const c = require("../controllers/downscalingController");
const router = express.Router();
router.get("/", c.getDownscaling);
module.exports = router;
