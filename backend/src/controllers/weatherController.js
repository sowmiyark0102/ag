const ApiError = require("../utils/apiError");
const asyncHandler = require("../middleware/asyncHandler");
const { seedIfNeeded } = require("../data/store");
const { observationsDesc, forecastsAsc, rainMemory } = require("../services/weatherData");

function need(id) {
  if (!id) throw new ApiError(400, "Select your Panchayat to view local weather information.", "VALIDATION_ERROR");
}

exports.getForecast = asyncHandler(async (req, res) => {
  seedIfNeeded();
  need(req.query.panchayatId);
  res.json({ success: true, forecasts: forecastsAsc(req.query.panchayatId) });
});

exports.getHistory = asyncHandler(async (req, res) => {
  seedIfNeeded();
  const { panchayatId, from, to } = req.query;
  need(panchayatId);
  let observations = observationsDesc(panchayatId).slice().reverse();
  if (from && !isNaN(new Date(from))) observations = observations.filter((o) => new Date(o.observedAt) >= new Date(from));
  if (to && !isNaN(new Date(to))) observations = observations.filter((o) => new Date(o.observedAt) <= new Date(to + "T23:59:59"));
  res.json({ success: true, observations });
});

exports.getRainMemory = asyncHandler(async (req, res) => {
  seedIfNeeded();
  need(req.query.panchayatId);
  const rm = rainMemory(req.query.panchayatId);
  if (!rm) throw new ApiError(404, "Not enough weather information is available.", "NO_DATA");
  res.json({ success: true, rainMemory: rm });
});
