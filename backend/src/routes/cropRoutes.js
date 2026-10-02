const express = require("express");
const router = express.Router();
const cropController = require("../controllers/cropController");

router.get("/", cropController.listCrops);
router.get("/:id", cropController.getCrop);
router.get("/:id/risk", cropController.getCropRisk);

module.exports = router;
