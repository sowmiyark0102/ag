/**
 * Farmer Photo + Weather Risk Check.
 * No real computer-vision disease classifier is connected in this prototype,
 * so results are always clearly labelled as a demonstration and combined with
 * real weather-risk reasoning rather than any image-derived diagnosis.
 */

function evaluatePhotoRisk({ crop, cropStage, weather }) {
  const humidity = weather?.humidityPct ?? 0;
  const rainfall = weather?.rainfallMm ?? 0;

  let riskCategory = "LOW";
  let explanation = "Current weather conditions do not strongly favour disease development.";

  if (humidity >= 80 && rainfall >= 20) {
    riskCategory = "MODERATE";
    explanation = "Conditions may be favourable for fungal disease development given the high humidity and recent rainfall.";
  }
  if (humidity >= 88 && rainfall >= 35) {
    riskCategory = "HIGH";
    explanation = "Humidity and rainfall are both elevated, which increases the chance of fungal disease pressure at this crop stage.";
  }

  return {
    riskCategory,
    explanation,
    recommendation:
      riskCategory === "LOW"
        ? "Continue routine monitoring."
        : "Inspect the crop within 24 hours and consult local agricultural guidance before applying any treatment.",
    dataQuality: "DEMONSTRATION IMAGE ANALYSIS",
    disclaimer: "Risk/inspection advisory only. This does not diagnose plant disease.",
  };
}

module.exports = { evaluatePhotoRisk };
