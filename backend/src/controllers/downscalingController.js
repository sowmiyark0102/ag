const ApiError = require("../utils/apiError");
const asyncHandler = require("../middleware/asyncHandler");
const { collections, seedIfNeeded } = require("../data/store");
const { currentForecast, latestObservation } = require("../services/weatherData");
const { CONSTANTS } = require("../services/downscaling");

const round1 = (n) => Math.round(n * 10) / 10;

exports.getDownscaling = asyncHandler(async (req, res) => {
  seedIfNeeded();
  const p = collections.panchayats.findById(req.query.panchayatId);
  if (!p) throw new ApiError(400, "Select your Panchayat to view local weather information.", "VALIDATION_ERROR");
  const f = currentForecast(p._id);
  if (!f) throw new ApiError(404, "Not enough weather information is available.", "NO_DATA");

  const siblings = collections.panchayats.find((x) => x.block === p.block && x.district === p.district);
  const blockComparison = siblings.map((s) => {
    const sf = currentForecast(s._id);
    return sf ? {
      panchayatId: s._id, name: s.name, elevationM: s.elevationM, coastDistanceKm: s.coastDistanceKm, nearWaterBody: s.nearWaterBody,
      local: { temperatureC: sf.temperatureC, rainProbabilityPct: sf.rainProbabilityPct, rainfallMm: sf.rainfallMm, expectedRainfallMinMm: sf.expectedRainfallMinMm, expectedRainfallMaxMm: sf.expectedRainfallMaxMm, humidityPct: sf.humidityPct, windKmh: sf.windKmh },
      difference: { temperatureC: round1(sf.temperatureC - sf.regional.tempC), rainProbabilityPts: sf.rainProbabilityPct - sf.regional.rainProbabilityPct, rainfallMm: round1(sf.rainfallMm - sf.regional.rainfallMm), humidityPts: sf.humidityPct - sf.regional.humidityPct, windKmh: sf.windKmh - sf.regional.windKmh },
    } : null;
  }).filter(Boolean);

  const regional = collections.regionalForecasts.find((r) => r.block === p.block && r.district === p.district).sort((a, b) => new Date(a.forDate) - new Date(b.forDate))[0] || null;

  res.json({
    success: true,
    panchayat: p,
    features: {
      latitude: p.lat, longitude: p.lng, elevationM: p.elevationM, blockReferenceElevationM: p.blockReferenceElevationM,
      elevationDeltaM: f.elevationDeltaM, coastDistanceKm: p.coastDistanceKm, coastalInfluence: f.coastFactor, nearWaterBody: p.nearWaterBody, source: p.geoFeatureSource,
    },
    resolution: {
      regional: regional ? `Regional grid cell about ${regional.gridResolutionKm} km wide (block-level reference, demonstration values)` : "Regional cell (demonstration values)",
      local: "Panchayat point estimate (one location per Panchayat)",
      sourceStatus: f.source === "DEMO" ? "DEMONSTRATION DATA" : f.source,
      liveSource: "No live regional data source is connected in this prototype. See Data Sources.",
    },
    inference: {
      method: f.method, forDate: f.forDate, regional: f.regional, local: {
        temperatureC: f.temperatureC, temperatureMinC: f.temperatureMinC, temperatureMaxC: f.temperatureMaxC, rainProbabilityPct: f.rainProbabilityPct,
        rainfallMm: f.rainfallMm, expectedRainfallMinMm: f.expectedRainfallMinMm, expectedRainfallMaxMm: f.expectedRainfallMaxMm, humidityPct: f.humidityPct, windKmh: f.windKmh, cloudCoverPct: f.cloudCoverPct,
      },
      adjustments: f.adjustments, uncertainty: f.uncertainty, currentObservation: latestObservation(p._id),
    },
    blockComparison,
    method: {
      name: "Rule-based geographic downscaling (demonstration)",
      kind: "RULE_BASED_DEMONSTRATION",
      isTrainedModel: false,
      description: "A regional (block/grid-cell) forecast is adjusted using elevation, distance to coast and nearby water. Each adjustment is listed with its value so the result can be checked by hand.",
      constants: CONSTANTS,
      mlServiceNote: "An optional Random Forest demonstration service exists in ml-service/. It is trained on synthetic data, is not used for these numbers, and no accuracy is claimed for it.",
    },
  });
});
