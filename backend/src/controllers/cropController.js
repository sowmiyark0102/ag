const ApiError = require("../utils/apiError");
const asyncHandler = require("../middleware/asyncHandler");
const { evaluateCropRisk } = require("../engines/cropRiskEngine");
const { collections, seedIfNeeded } = require("../data/store");
const { STAGE_GUIDE } = require("../data/cropStageData");
const { latestObservation, currentForecast, rainMemory } = require("../services/weatherData");

exports.listCrops = asyncHandler(async (req, res) => {
  seedIfNeeded();
  const crops = collections.cropProfiles.find().map((c) => ({ ...c, stageGuide: STAGE_GUIDE[c.name] || {} }));
  res.json({ success: true, crops });
});

exports.getCrop = asyncHandler(async (req, res) => {
  seedIfNeeded();
  const crop = collections.cropProfiles.findById(req.params.id);
  if (!crop) throw new ApiError(404, "Crop profile not found.", "NOT_FOUND");
  res.json({ success: true, crop: { ...crop, stageGuide: STAGE_GUIDE[crop.name] || {} } });
});

exports.getCropRisk = asyncHandler(async (req, res) => {
  seedIfNeeded();
  const crop = collections.cropProfiles.findById(req.params.id);
  if (!crop) throw new ApiError(404, "Crop profile not found.", "NOT_FOUND");
  const { panchayatId, cropStage } = req.query;
  if (!panchayatId) throw new ApiError(400, "Select your Panchayat to view crop risk.", "VALIDATION_ERROR");
  const stage = crop.stages.includes(cropStage) ? cropStage : "Vegetative";
  const rm = rainMemory(panchayatId);
  const risk = evaluateCropRisk({ crop: crop.name, cropStage: stage, weather: latestObservation(panchayatId), forecast: currentForecast(panchayatId), recentRainMm: rm ? rm.last3dMm : undefined });
  res.json({ success: true, risk, cropStage: stage });
});
