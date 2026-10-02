const ApiError = require("../utils/apiError");
const asyncHandler = require("../middleware/asyncHandler");
const { evaluateFarmActivity, ACTIVITIES } = require("../engines/weatherDecisionEngine");
const { seedIfNeeded } = require("../data/store");
const { latestObservation, currentForecast, rainMemory } = require("../services/weatherData");

exports.shouldIFarmToday = asyncHandler(async (req, res) => {
  seedIfNeeded();
  const { panchayatId, activity, crop, cropStage } = req.query;
  if (!panchayatId || !activity) throw new ApiError(400, "Panchayat and activity are required.", "VALIDATION_ERROR");
  if (!ACTIVITIES.includes(activity)) throw new ApiError(400, "Unknown activity.", "VALIDATION_ERROR");
  const rm = rainMemory(panchayatId);
  const result = evaluateFarmActivity({ weather: latestObservation(panchayatId), forecast: currentForecast(panchayatId), activity, recentRainMm: rm ? rm.last3dMm : undefined, crop, cropStage });
  res.json({ success: true, ...result, activity, rainMemory: rm });
});

exports.activityWindow = asyncHandler(async (req, res) => {
  seedIfNeeded();
  const { panchayatId, activity } = req.query;
  if (!panchayatId || !activity) throw new ApiError(400, "Panchayat and activity are required.", "VALIDATION_ERROR");
  if (!ACTIVITIES.includes(activity)) throw new ApiError(400, "Unknown activity.", "VALIDATION_ERROR");
  const f = currentForecast(panchayatId);
  const w = latestObservation(panchayatId);
  const p = f ? f.rainProbabilityPct : 30;
  const wind = w ? w.windKmh : 10;
  const windy = wind >= 30;
  let windows;
  if (activity === "IRRIGATION") {
    // Irrigate in cooler hours; rain later in the day means less need.
    windows = [
      { window: "06:00-10:00", status: "SUITABLE" },
      { window: "10:00-14:00", status: "USE_CAUTION" },
      { window: "14:00-19:00", status: p >= 60 ? "HIGHER_RAIN_RISK" : "SUITABLE" },
    ];
  } else {
    // Demonstration rule: rain is assumed more likely later in the day.
    const sprayWindy = (activity === "SPRAYING" || activity === "DRYING") && windy;
    windows = [
      { window: "06:00-10:00", status: sprayWindy ? "USE_CAUTION" : p < 65 ? "SUITABLE" : "USE_CAUTION" },
      { window: "10:00-14:00", status: p < 40 ? "SUITABLE" : "USE_CAUTION" },
      { window: "14:00-19:00", status: p >= 50 ? "HIGHER_RAIN_RISK" : "USE_CAUTION" },
    ];
  }
  res.json({ success: true, activity, windows, source: f ? f.source : "DEMO", ruleNote: "Rule-based demonstration windows derived from today's rain probability and wind.", disclaimer: "Decision-support guidance only. Follow local agricultural guidance when conditions are uncertain." });
});
