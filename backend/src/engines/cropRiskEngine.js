/**
 * Transparent crop risk engine (rule-based demonstration).
 * Combines current/forecast weather with stage sensitivity. Never diagnoses disease.
 */
const { getStageGuide } = require("../data/cropStageData");

const ORDER = { HIGH: 3, MODERATE: 2, LOW: 1 };

function evaluateCropRisk({ crop, cropStage, weather, forecast, recentRainMm }) {
  const guide = getStageGuide(crop, cropStage);
  const stageGuide = guide
    ? { advisory: guide.advisory, advisoryTa: guide.advisoryTa, waterNeed: guide.waterNeed, sensitiveTo: guide.sensitiveTo, monitor: guide.monitor }
    : null;

  if (!weather) {
    return {
      riskType: "UNKNOWN",
      riskLevel: "INSUFFICIENT_DATA",
      reason: "Not enough weather information is available to assess crop risk.",
      monitoringAdvice: "Check back once local weather data is available.",
      dataQuality: "DEMO",
      affectedCropStage: cropStage,
      allRisks: [],
      stageGuide,
      watchList: guide ? guide.sensitiveTo : [],
    };
  }

  const rain = Math.max(weather.rainfallMm ?? 0, 0);
  const rain3d = recentRainMm ?? rain;
  const temp = weather.temperatureC ?? 0;
  const wind = Math.max(weather.windKmh ?? 0, forecast?.windKmh ?? 0);
  const humidity = weather.humidityPct ?? 0;
  const rainProb = forecast?.rainProbabilityPct ?? 0;
  const expectedMax = forecast?.expectedRainfallMaxMm ?? 0;

  const risks = [];
  if (rain >= 50 || rain3d >= 80 || (rainProb >= 75 && expectedMax >= 30)) {
    risks.push({ riskType: "HEAVY_RAIN", riskLevel: "HIGH", reason: "Recent or forecast rainfall is significantly above normal.", monitoringAdvice: "Check field drainage and bunds; avoid fertilizer application until conditions dry out." });
  } else if (rainProb >= 60 && rain3d >= 40) {
    risks.push({ riskType: "HEAVY_RAIN", riskLevel: "MODERATE", reason: "Rain is likely and the ground has already received a lot of rain.", monitoringAdvice: "Keep drainage channels open and avoid fertilizer or spraying before the rain." });
  }
  if (rain3d >= 60 && !["Paddy", "Sugarcane"].includes(crop)) {
    risks.push({ riskType: "WATERLOGGING", riskLevel: rain3d >= 90 ? "HIGH" : "MODERATE", reason: "Standing water may accumulate in low-lying parts of the field after recent rainfall.", monitoringAdvice: "Inspect low-lying areas for water stagnation within 24 hours." });
  }
  if (temp >= 36) {
    risks.push({ riskType: "HEAT_STRESS", riskLevel: "MODERATE", reason: "Daytime temperature is high enough to stress the crop.", monitoringAdvice: "Monitor for leaf wilting; adjust irrigation timing." });
  }
  if (wind >= 30) {
    risks.push({ riskType: "STRONG_WIND", riskLevel: "MODERATE", reason: "Wind speed is high enough to risk lodging or plant damage.", monitoringAdvice: "Inspect for lodging or stem damage after the wind passes." });
  }
  if (humidity >= 80 && temp >= 22 && temp <= 32) {
    risks.push({ riskType: "DISEASE_FAVOURABLE_WEATHER", riskLevel: humidity >= 88 ? "HIGH" : "MODERATE", reason: "Conditions may be favourable for fungal disease development (high humidity, moderate temperature).", monitoringAdvice: "Inspect the crop within 24 hours. This is a weather-based risk, not a diagnosis." });
  }
  if (rain3d <= 5 && rainProb <= 15 && humidity <= 45) {
    risks.push({ riskType: "DROUGHT", riskLevel: "MODERATE", reason: "Rainfall has been low and no significant rain is expected; soil moisture may decline.", monitoringAdvice: "Check soil moisture and consider irrigation scheduling." });
  }

  // Raise level when this stage is especially sensitive to the risk.
  const sensitive = guide ? guide.sensitiveTo : [];
  for (const r of risks) {
    r.stageSensitive = sensitive.includes(r.riskType);
    if (r.stageSensitive && r.riskLevel === "MODERATE") r.riskLevel = "HIGH";
  }
  risks.sort((a, b) => ORDER[b.riskLevel] - ORDER[a.riskLevel]);

  const watchList = sensitive.filter((s) => !risks.some((r) => r.riskType === s));

  if (risks.length === 0) {
    return {
      riskType: "NONE",
      riskLevel: "LOW",
      reason: "Current and forecast weather conditions do not indicate an elevated crop risk.",
      monitoringAdvice: guide ? guide.monitor : "Continue routine field monitoring.",
      dataQuality: weather.source || "DEMO",
      affectedCropStage: cropStage,
      allRisks: [],
      stageGuide,
      watchList,
    };
  }

  return { ...risks[0], affectedCropStage: cropStage, allRisks: risks, stageGuide, watchList, dataQuality: weather.source || "DEMO" };
}

module.exports = { evaluateCropRisk };
