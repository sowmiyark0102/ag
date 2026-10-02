const ApiError = require("../utils/apiError");
const asyncHandler = require("../middleware/asyncHandler");
const { collections, seedIfNeeded } = require("../data/store");
const { latestObservation, currentForecast, rainMemory } = require("../services/weatherData");

const RISK_LEVELS = ["NORMAL", "CAUTION", "HIGH_RISK"];

exports.listPanchayats = asyncHandler(async (req, res) => {
  seedIfNeeded();
  const panchayats = collections.panchayats.find().slice().sort((a, b) => a.district.localeCompare(b.district) || a.block.localeCompare(b.block) || a.name.localeCompare(b.name));
  res.json({ success: true, panchayats });
});

exports.summary = asyncHandler(async (req, res) => {
  seedIfNeeded();
  const alerts = collections.alerts.find((a) => a.active);
  const list = collections.panchayats.find().map((p) => {
    const o = latestObservation(p._id), f = currentForecast(p._id), rm = rainMemory(p._id);
    return {
      _id: p._id, name: p.name, block: p.block, district: p.district, lat: p.lat, lng: p.lng, riskLevel: p.riskLevel, dominantCrop: p.dominantCrop,
      temperatureC: o ? o.temperatureC : null, humidityPct: o ? o.humidityPct : null, windKmh: o ? o.windKmh : null, last3dMm: rm ? rm.last3dMm : null,
      rainProbabilityPct: f ? f.rainProbabilityPct : null, expectedRainfallMinMm: f ? f.expectedRainfallMinMm : null, expectedRainfallMaxMm: f ? f.expectedRainfallMaxMm : null,
      activeAlerts: alerts.filter((a) => a.panchayat === p._id).length, source: o ? o.source : "DEMO",
    };
  });
  res.json({ success: true, panchayats: list });
});

exports.getPanchayatWeather = asyncHandler(async (req, res) => {
  seedIfNeeded();
  const panchayat = collections.panchayats.findById(req.params.id);
  if (!panchayat) throw new ApiError(404, "Select your Panchayat to view local weather information.", "NOT_FOUND");
  res.json({ success: true, panchayat, observation: latestObservation(panchayat._id), forecast: currentForecast(panchayat._id), rainMemory: rainMemory(panchayat._id) });
});

exports.updatePanchayat = asyncHandler(async (req, res) => {
  const previous = collections.panchayats.findById(req.params.id);
  if (!previous) throw new ApiError(404, "Panchayat not found.", "NOT_FOUND");
  const updates = {};
  if (req.body.riskLevel !== undefined) {
    if (!RISK_LEVELS.includes(req.body.riskLevel)) throw new ApiError(400, "Risk level must be NORMAL, CAUTION or HIGH_RISK.", "VALIDATION_ERROR");
    updates.riskLevel = req.body.riskLevel;
  }
  if (req.body.dominantCrop !== undefined) updates.dominantCrop = String(req.body.dominantCrop).slice(0, 40);
  const panchayat = collections.panchayats.updateById(req.params.id, updates);
  collections.auditLogs.create({ user: req.user._id, role: req.user.role, action: "UPDATE_PANCHAYAT", target: panchayat._id, previousValue: { riskLevel: previous.riskLevel, dominantCrop: previous.dominantCrop }, newValue: updates });
  res.json({ success: true, panchayat });
});
