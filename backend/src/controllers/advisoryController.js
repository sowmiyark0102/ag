const ApiError = require("../utils/apiError");
const asyncHandler = require("../middleware/asyncHandler");
const { collections, seedIfNeeded } = require("../data/store");
const { getStageGuide } = require("../data/cropStageData");

exports.listAdvisories = asyncHandler(async (req, res) => {
  seedIfNeeded();
  const { panchayatId, crop, cropStage } = req.query;
  let items = collections.advisories.find((a) => (!panchayatId || a.panchayat === panchayatId) && (!crop || a.crop === crop) && (!cropStage || a.cropStage === cropStage));
  items = items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const guide = crop && cropStage ? getStageGuide(crop, cropStage) : null;
  res.json({ success: true, advisories: items, stageGuide: guide });
});

exports.createAdvisory = asyncHandler(async (req, res) => {
  const { panchayatId, crop, cropStage, title, body } = req.body || {};
  if (!title || !body) throw new ApiError(400, "Title and advisory text are required.", "VALIDATION_ERROR");
  const advisory = collections.advisories.create({ panchayat: panchayatId || null, crop: crop || "", cropStage: cropStage || "", title: String(title).slice(0, 120), body: String(body).slice(0, 600), createdBy: req.user._id });
  collections.auditLogs.create({ user: req.user._id, role: req.user.role, action: "CREATE_ADVISORY", target: advisory._id, previousValue: null, newValue: advisory });
  res.status(201).json({ success: true, advisory });
});
