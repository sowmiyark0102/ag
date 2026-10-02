const express = require("express");
const c = require("../controllers/riskSavedController");
const { requireAuth, requireRole } = require("../middleware/auth");
const router = express.Router();
router.post("/calculate", requireAuth, requireRole("FARMER"), c.calculate);
router.get("/history", requireAuth, requireRole("FARMER"), c.history);
module.exports = router;
