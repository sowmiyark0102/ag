const express = require("express");
const upload = require("../middleware/upload");
const c = require("../controllers/reportController");
const { requireAuth, requireRole } = require("../middleware/auth");
const router = express.Router();

// Farmer-only: create + view own reports. Role and identity come from the verified JWT, never the request body.
router.post("/", requireAuth, requireRole("FARMER"), upload.single("photo"), c.createReport);
router.get("/my", requireAuth, requireRole("FARMER"), c.myReports);
router.get("/:id", requireAuth, requireRole("FARMER"), c.getMyReportById);

module.exports = router;
