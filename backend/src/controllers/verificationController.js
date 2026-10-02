const asyncHandler = require("../middleware/asyncHandler");
const { collections, seedIfNeeded } = require("../data/store");

const MIN_SAMPLES = 10;
const round = (n) => +n.toFixed(2);

function stats(records, predKey, actKey) {
  const n = records.length;
  let abs = 0, sq = 0, sum = 0;
  for (const r of records) { const e = r[predKey] - r[actKey]; abs += Math.abs(e); sq += e * e; sum += e; }
  return { mae: round(abs / n), rmse: round(Math.sqrt(sq / n)), bias: round(sum / n) };
}

exports.getVerification = asyncHandler(async (req, res) => {
  seedIfNeeded();
  const { panchayatId, block, district } = req.query;
  const records = collections.forecastVerifications
    .find((r) => (!panchayatId || r.panchayat === panchayatId) && (!block || r.block === block) && (!district || r.district === district))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  const source = records.length && records.every((r) => r.source === "DEMO") ? "DEMO" : "MIXED";
  const base = { success: true, records, source, minSamples: MIN_SAMPLES };
  if (records.length < MIN_SAMPLES) {
    return res.json({ ...base, metrics: null, message: "Not enough observations are available to evaluate this forecast reliably." });
  }
  res.json({
    ...base,
    metrics: {
      sampleSize: records.length,
      rainfall: { downscaled: stats(records, "predictedRainfallMm", "actualRainfallMm"), regionalBaseline: stats(records, "regionalRainfallMm", "actualRainfallMm") },
      temperature: { downscaled: stats(records, "predictedTemperatureC", "actualTemperatureC"), regionalBaseline: stats(records, "regionalTemperatureC", "actualTemperatureC") },
    },
    note: source === "DEMO" ? "These observations are synthetic demonstration data, so the numbers show how verification works, not real-world forecast skill." : "",
  });
});

exports.getModelMetrics = asyncHandler(async (req, res) => {
  seedIfNeeded();
  res.json({ success: true, metrics: collections.modelMetrics.find(), note: "Demonstration method. No accuracy figures are claimed." });
});
