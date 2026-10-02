const express = require("express");
const c = require("../controllers/advisoryController");
const { requireAuth, requireRole } = require("../middleware/auth");
const router = express.Router();
router.get("/", c.listAdvisories);
router.post("/", requireAuth, requireRole("OFFICER"), c.createAdvisory);
module.exports = router;
