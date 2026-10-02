const express = require("express");
const router = express.Router();
const panchayatController = require("../controllers/panchayatController");
const { requireAuth, requireRole } = require("../middleware/auth");

router.get("/", panchayatController.listPanchayats);
router.get("/summary", panchayatController.summary);
router.get("/:id/weather", panchayatController.getPanchayatWeather);
router.put("/:id", requireAuth, requireRole("OFFICER"), panchayatController.updatePanchayat);

module.exports = router;
