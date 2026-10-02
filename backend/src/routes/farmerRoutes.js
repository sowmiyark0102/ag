const express = require("express");
const upload = require("../middleware/upload");
const c = require("../controllers/photoRiskController");
const { requireAuth, requireRole } = require("../middleware/auth");
const router = express.Router();
router.post("/photo-risk", requireAuth, requireRole("FARMER"), upload.single("photo"), c.submitPhotoRisk);
router.get("/photo-risk/history", requireAuth, requireRole("FARMER"), c.myHistory);
module.exports = router;
