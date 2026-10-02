/**
 * Centralized "Should I Farm Today?" decision logic (rule-based demonstration).
 * Never fabricates confidence percentages - returns a status plus human reasons.
 */
const { getStageGuide } = require("../data/cropStageData");

const ACTIVITIES = ["SOWING", "IRRIGATION", "SPRAYING", "FERTILIZER_APPLICATION", "HARVESTING", "DRYING"];

function evaluateFarmActivity({ weather, forecast, activity, recentRainMm, crop, cropStage }) {
  if (!weather || !forecast) {
    return {
      status: "INSUFFICIENT_DATA",
      reason: "Not enough weather information is available to make a reliable recommendation.",
      factors: [],
      dataQuality: weather?.source || "DEMO",
      recommendationType: "rule-based demonstration",
    };
  }

  const factors = [];
  let score = 0;
  const rainProb = forecast.rainProbabilityPct ?? 0;
  const recent = recentRainMm ?? weather.rainfallMm ?? 0;
  const wind = weather.windKmh ?? 0;
  const humidity = weather.humidityPct ?? 0;
  const guide = crop && cropStage ? getStageGuide(crop, cropStage) : null;

  if (rainProb >= 60) { factors.push("Rain is expected later today."); score += 2; }
  else if (rainProb >= 35) { factors.push("There is a moderate chance of rain today."); score += 1; }

  if (recent >= 60) { factors.push("Recent rainfall (last 3 days) is already high."); score += 2; }
  else if (recent >= 25) { factors.push("There has been some rainfall in the last 3 days."); score += 1; }

  if (wind >= 30) { factors.push("Wind speed is high, which affects spraying accuracy and drying."); score += activity === "SPRAYING" || activity === "DRYING" ? 2 : 1; }
  if (humidity >= 85) { factors.push("Humidity is high, which can favour fungal disease development."); score += 1; }

  const rainSensitive = ["SOWING", "SPRAYING", "FERTILIZER_APPLICATION", "HARVESTING", "DRYING"];
  if (rainSensitive.includes(activity) && rainProb >= 60) score += 1;

  if (activity === "IRRIGATION") {
    // Irrigation logic is the reverse: rain means less need, dry weather means more.
    score = 0;
    factors.length = 0;
    if (recent >= 40 || rainProb >= 60) {
      factors.push("Recent or expected rain may already meet the crop's water needs; irrigation may not be needed.");
      score = 2;
    } else if (recent <= 10 && rainProb < 35) {
      factors.push("Little rain has fallen and little is expected, so irrigation is likely useful.");
    } else {
      factors.push("Rainfall is moderate; check soil moisture before irrigating.");
      score = 1;
    }
    if (wind >= 30) { factors.push("Strong wind can make sprinkler irrigation uneven."); score += 1; }
  }

  if (guide && guide.sensitiveTo.includes("HEAVY_RAIN") && rainProb >= 60 && activity !== "IRRIGATION") {
    factors.push(`The ${cropStage.toLowerCase()} stage of ${crop} is sensitive to heavy rain.`);
    score += 1;
  }

  let status = "SUITABLE";
  if (score >= 4) status = "NOT_RECOMMENDED";
  else if (score >= 2) status = "USE_CAUTION";
  if (factors.length === 0) factors.push("Current weather conditions are within a normal range for this activity.");

  return { status, reason: factors.join(" "), factors, dataQuality: weather.source || "DEMO", recommendationType: "rule-based demonstration" };
}

module.exports = { evaluateFarmActivity, ACTIVITIES };
