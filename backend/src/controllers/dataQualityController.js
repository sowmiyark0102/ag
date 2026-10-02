const asyncHandler = require("../middleware/asyncHandler");
const { collections, seedIfNeeded } = require("../data/store");

function summarise(name, source, items, dateKey, fields, totalPanchayats) {
  const last = items.reduce((m, i) => (i[dateKey] && i[dateKey] > m ? i[dateKey] : m), "");
  const missing = items.reduce((s, i) => s + fields.filter((f) => i[f] === null || i[f] === undefined).length, 0);
  const covered = new Set(items.map((i) => i.panchayat)).size;
  return { name, source, lastUpdated: last || null, observationCount: items.length, missingValues: missing, coveragePct: totalPanchayats ? Math.round((covered / totalPanchayats) * 100) : 0 };
}

exports.getDataQuality = asyncHandler(async (req, res) => {
  seedIfNeeded();
  const total = collections.panchayats.count();
  const obs = collections.weatherObservations.find();
  const fcs = collections.weatherForecasts.find();
  const ver = collections.forecastVerifications.find();
  res.json({
    success: true,
    demoMode: true,
    resolution: { regional: "About 9 km regional grid cell per block (demonstration values)", local: "One point estimate per Panchayat", geographicFeatures: "Elevation is an approximate demonstration value; distance to coast is computed from coordinates." },
    notes: ["All weather values are seeded demonstration data. No live government or satellite feed is connected.", "Uncertainty ranges are nominal rule-based widths, not calibrated confidence intervals.", "Verification uses synthetic observations."],
    sources: [
      summarise("Panchayat weather observations", obs[0]?.source || "DEMO", obs, "observedAt", ["temperatureC", "humidityPct", "windKmh", "rainfallMm", "cloudCoverPct"], total),
      summarise("Panchayat weather forecasts", fcs[0]?.source || "DEMO", fcs, "forDate", ["rainProbabilityPct", "expectedRainfallMinMm", "expectedRainfallMaxMm", "temperatureMinC", "temperatureMaxC"], total),
      summarise("Regional (block-level) forecasts", "DEMO", collections.regionalForecasts.find(), "forDate", ["tempC", "humidityPct", "windKmh", "rainfallMm", "rainProbabilityPct"], total),
      summarise("Forecast verification records", "DEMO", ver, "date", ["predictedRainfallMm", "actualRainfallMm", "predictedTemperatureC", "actualTemperatureC"], total),
    ],
  });
});
