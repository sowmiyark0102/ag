const express = require("express");
const c = require("../controllers/voiceController");
const { optionalAuth } = require("../middleware/auth");
const router = express.Router();
router.get("/menu", c.getMenu);
router.post("/session", optionalAuth, c.postSession);
module.exports = router;
