const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const officer = require("../controllers/officerController");
const alerts = require("../controllers/alertController");
const photo = require("../controllers/photoRiskController");
const panchayats = require("../controllers/panchayatController");
const reports = require("../controllers/reportController");
const router = express.Router();

router.use(requireAuth, requireRole("OFFICER"));
router.get("/dashboard", officer.dashboard);
router.get("/farmer-reports", officer.farmerReports);
router.post("/farmer-reports/:id/review", photo.officerReview);
router.post("/alerts", alerts.createAlert);
router.post("/alerts/:id/close", alerts.deactivateAlert);
router.put("/panchayats/:id", panchayats.updatePanchayat);
router.get("/audit-logs", officer.auditLogs);

// Farmer -> Officer problem reports (jurisdiction-filtered by the officer's own district from the JWT/user record)
router.get("/reports", reports.officerListReports);
router.get("/reports/metrics", reports.officerReportMetrics);
router.get("/reports/:id", reports.officerGetReport);
router.patch("/reports/:id/status", reports.officerUpdateStatus);
router.patch("/reports/:id/response", reports.officerUpdateResponse);
module.exports = router;
