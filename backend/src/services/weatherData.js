const { collections } = require("../data/store");

function observationsDesc(panchayatId) {
  return collections.weatherObservations
    .find((o) => o.panchayat === panchayatId)
    .sort((a, b) => new Date(b.observedAt) - new Date(a.observedAt));
}

function forecastsAsc(panchayatId) {
  return collections.weatherForecasts
    .find((f) => f.panchayat === panchayatId)
    .sort((a, b) => new Date(a.forDate) - new Date(b.forDate));
}

const latestObservation = (id) => observationsDesc(id)[0] || null;
const currentForecast = (id) => forecastsAsc(id)[0] || null;

/** Rain Memory: how much rain fell recently and how much is expected next. */
function rainMemory(panchayatId) {
  const obs = observationsDesc(panchayatId);
  if (!obs.length) return null;
  const fc = currentForecast(panchayatId);
  const sum = (n) => Math.round(obs.slice(0, n).reduce((s, o) => s + (o.rainfallMm || 0), 0));
  const last24h = sum(1);
  const last3d = sum(3);
  const last7d = sum(7);
  const nextMin = fc ? fc.expectedRainfallMinMm : 0;
  const nextMax = fc ? fc.expectedRainfallMaxMm : 0;
  const next24hMm = Math.round((nextMin + nextMax) / 2);

  let risk = "NORMAL";
  if (last7d >= 120 || (last3d >= 60 && next24hMm >= 20)) risk = "HIGH_RISK";
  else if (last3d >= 35 || next24hMm >= 25 || last7d >= 80) risk = "CAUTION";

  const explanation = {
    HIGH_RISK: {
      en: "Recent rainfall is already high and additional rain is expected.",
      ta: "சமீபத்தில் ஏற்கனவே அதிக மழை பெய்துள்ளது; மேலும் மழை எதிர்பார்க்கப்படுகிறது.",
    },
    CAUTION: {
      en: "Recent or expected rainfall is moderate. Keep an eye on field drainage.",
      ta: "சமீபத்திய அல்லது எதிர்பார்க்கப்படும் மழை மிதமானது. வயல் வடிகாலை கவனியுங்கள்.",
    },
    NORMAL: {
      en: "Recent and expected rainfall are within a normal range.",
      ta: "சமீபத்திய மற்றும் எதிர்பார்க்கப்படும் மழை சாதாரண அளவில் உள்ளது.",
    },
  }[risk];

  return {
    last24hMm: last24h,
    last3dMm: last3d,
    last7dMm: last7d,
    next24hMm,
    next24hRange: [nextMin, nextMax],
    risk,
    explanation,
    source: obs[0].source || "DEMO",
  };
}

module.exports = { observationsDesc, forecastsAsc, latestObservation, currentForecast, rainMemory };
