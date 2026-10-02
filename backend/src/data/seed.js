const bcrypt = require("bcryptjs");
const { evaluatePhotoRisk } = require("../engines/photoRiskEngine");
const { distanceToCoastKm } = require("./geo");
const { downscale } = require("../services/downscaling");

// Deterministic pseudo-random numbers so every server instance (local or serverless) seeds identical data.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/**
 * DEMONSTRATION GEOGRAPHY: Panchayat names, block groupings, coordinates and elevations are approximate
 * illustrative values, not official records. Elevation would come from a DEM (e.g. SRTM) in production.
 */
const P = (n, name, block, district, lat, lng, elevationM, crop, nearWaterBody = false) => ({ n, name, block, district, lat, lng, elevationM, crop, nearWaterBody });
const GEO = [
  P(1, "Example Panchayat", "Example Block", "Tiruvallur", 13.14, 79.91, 42, "Paddy"),
  P(2, "Example Hills Panchayat", "Example Block", "Tiruvallur", 13.19, 79.86, 118, "Groundnut"),
  P(3, "Example Lake Panchayat", "Example Block", "Tiruvallur", 13.1, 79.96, 24, "Paddy", true),
  P(4, "Ellapuram", "Uthukottai Block", "Tiruvallur", 13.36, 79.85, 95, "Groundnut"),
  P(5, "Poondi", "Uthukottai Block", "Tiruvallur", 13.2, 79.83, 60, "Paddy", true),
  P(6, "Vayalur", "Uthukottai Block", "Tiruvallur", 13.18, 79.6, 140, "Maize"),
  P(7, "Gummidipoondi", "Gummidipoondi Block", "Tiruvallur", 13.41, 80.11, 14, "Tomato"),
  P(8, "Pulicat", "Gummidipoondi Block", "Tiruvallur", 13.42, 80.32, 2, "Banana", true),
  P(9, "Sholavaram", "Gummidipoondi Block", "Tiruvallur", 13.19, 80.15, 20, "Paddy", true),
  P(10, "Thiruvalangadu", "Pallipattu Block", "Tiruvallur", 13.13, 79.97, 55, "Maize"),
  P(11, "Kadambathur", "Pallipattu Block", "Tiruvallur", 13.02, 79.88, 48, "Banana"),
  P(12, "Orathanadu", "Orathanadu Block", "Thanjavur", 10.62, 79.28, 15, "Paddy"),
  P(13, "Annur", "Annur Block", "Coimbatore", 11.23, 77.1, 330, "Sugarcane"),
  P(14, "Melur", "Melur Block", "Madurai", 10.03, 78.34, 150, "Banana"),
];

const CROPS = ["Paddy", "Groundnut", "Maize", "Tomato", "Banana", "Sugarcane"];
const CROP_INFO = {
  Paddy: ["Warm, humid conditions with standing water during most stages.", "Sensitive to prolonged heavy rain during seedling and flowering, and to hot dry wind at flowering.", ["Heavy Rain", "Strong Wind", "Disease-Favourable Weather"]],
  Groundnut: ["Well-drained soil; sensitive to waterlogging.", "High rainfall during pod formation can encourage fungal problems.", ["Waterlogging", "Disease-Favourable Weather", "Drought"]],
  Maize: ["Needs moderate, consistent moisture.", "Very sensitive to water stress at flowering; strong wind can cause lodging.", ["Drought", "Heat Stress", "Strong Wind"]],
  Tomato: ["Moderate temperature; sensitive to waterlogging and high humidity.", "High humidity favours fungal problems; heavy rain can crack fruit and cause flower drop.", ["Disease-Favourable Weather", "Heavy Rain", "Heat Stress"]],
  Banana: ["Needs steady water and shelter from strong wind.", "Very sensitive to strong wind, which can topple plants.", ["Strong Wind", "Waterlogging", "Drought"]],
  Sugarcane: ["Tolerates high water availability; long growing season.", "Drought during early growth reduces yield; strong wind can lodge tall cane.", ["Drought", "Strong Wind", "Heavy Rain"]],
};
const STAGES = ["Seedling", "Vegetative", "Flowering", "Fruiting", "Harvest"];

const LEAF_SVG = "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200"><rect width="300" height="200" fill="#E7F0E4"/><path d="M150 170C110 140 100 100 130 70C150 50 185 48 205 55C200 95 180 140 150 170Z" fill="#3FA35E"/><path d="M150 170C140 130 142 100 150 75" stroke="#14402B" stroke-width="3" fill="none"/><text x="150" y="192" font-size="11" text-anchor="middle" fill="#14402B">Sample crop photo (demo)</text></svg>');

const probFromRain = (mm) => clamp(Math.round(15 + mm * 3.2), 8, 92);
const EX_RAIN = [8, 22, 36, 14, 6, 0, 0, 3, 10, 0, 0, 5, 12, 0]; // index = days ago (Example Panchayat story)

// Regional (coarse grid cell) "truth" for a block on a given day offset (0 = today, positive = days ago).
function regionalTrue(bIdx, daysAgo, isExample) {
  const r = rng(500 + bIdx * 97 + daysAgo);
  const rain = isExample ? EX_RAIN[daysAgo] : Math.max(0, Math.round((9 + Math.sin(daysAgo * 1.3 + bIdx) * 11) * 10) / 10);
  const v = {
    tempC: 28 + Math.cos(daysAgo / 2 + bIdx) * 3,
    humidityPct: 76 + Math.sin(daysAgo + bIdx) * 10,
    windKmh: 11 + Math.abs(Math.sin(daysAgo * 0.7 + bIdx)) * 12,
    rainfallMm: rain,
    cloudCoverPct: 62 + Math.sin(daysAgo) * 25,
  };
  if (isExample && daysAgo === 0) Object.assign(v, { tempC: 28.9, humidityPct: 85.8, windKmh: 14, cloudCoverPct: 82.6 });
  return { ...v, _r: r };
}

// Regional forecast for a future day d (0 = today) for a block.
function regionalForecast(bIdx, d, isExample) {
  const rain = Math.max(0, Math.round((9 + Math.sin(d * 1.1 + bIdx + 2) * 11 + d) * 10) / 10);
  const base = {
    tempC: 28 + Math.cos(d / 2 + bIdx) * 2.5, humidityPct: 72 + Math.cos(d + bIdx) * 12,
    windKmh: 12 + Math.abs(Math.cos(d + bIdx)) * 14, cloudCoverPct: 55 + Math.sin(d + bIdx) * 25,
    rainfallMm: rain, rainProbabilityPct: probFromRain(rain),
  };
  if (isExample && d === 0) Object.assign(base, { tempC: 28.9, humidityPct: 85.8, windKmh: 14, cloudCoverPct: 85.6, rainfallMm: 25.4, rainProbabilityPct: 73 });
  return { ...base, tempMinC: base.tempC - 3.9, tempMaxC: base.tempC + 2.1 };
}

module.exports = function seed(collections) {
  const now = new Date();
  const DAY = 24 * 60 * 60 * 1000;

  // ----- Panchayats with engineered geographic features -----
  const blocks = {};
  GEO.forEach((g) => { (blocks[`${g.district}|${g.block}`] = blocks[`${g.district}|${g.block}`] || []).push(g); });
  const blockKeys = Object.keys(blocks);
  const refElev = {};
  blockKeys.forEach((k) => { refElev[k] = blocks[k].reduce((s, g) => s + g.elevationM, 0) / blocks[k].length; });

  const panchayats = collections.panchayats.insertMany(GEO.map((g) => ({
    _id: `pan-${g.n}`, name: g.name, block: g.block, district: g.district, lat: g.lat, lng: g.lng,
    dominantCrop: g.crop, riskLevel: "NORMAL", elevationM: g.elevationM, coastDistanceKm: distanceToCoastKm(g.lat, g.lng),
    nearWaterBody: g.nearWaterBody, blockReferenceElevationM: Math.round(refElev[`${g.district}|${g.block}`] * 10) / 10,
    geoFeatureSource: "DEMONSTRATION (approximate elevation; coast distance computed from coordinates)",
  })));

  collections.cropProfiles.insertMany(CROPS.map((name) => ({
    _id: `crop-${name.toLowerCase()}`, name, stages: STAGES, growingConditions: CROP_INFO[name][0], weatherSensitivity: CROP_INFO[name][1], riskFactors: CROP_INFO[name][2],
  })));

  const obs = [], fcs = [], ver = [], regional = [];
  const featOf = (p) => ({ elevationM: p.elevationM, coastDistanceKm: p.coastDistanceKm, nearWaterBody: p.nearWaterBody });

  blockKeys.forEach((bk, bIdx) => {
    const [district, block] = bk.split("|");
    const isExample = block === "Example Block";
    const ref = refElev[bk];
    const members = panchayats.filter((p) => p.block === block && p.district === district);

    // Regional forecasts (coarse ~9 km grid cell, demonstration values)
    const regFc = [];
    for (let d = 0; d < 5; d++) {
      const rf = regionalForecast(bIdx, d, isExample);
      regFc.push(rf);
      const rec = (x) => Math.round(x * 10) / 10;
      regional.push({ block, district, forDate: new Date(now.getTime() + d * DAY).toISOString(), tempC: rec(rf.tempC), tempMinC: rec(rf.tempMinC), tempMaxC: rec(rf.tempMaxC), humidityPct: Math.round(rf.humidityPct), windKmh: Math.round(rf.windKmh), rainfallMm: rec(rf.rainfallMm), rainProbabilityPct: Math.round(rf.rainProbabilityPct), cloudCoverPct: Math.round(rf.cloudCoverPct), cellMeanElevationM: Math.round(ref), gridResolutionKm: 9, source: "DEMO" });
    }

    members.forEach((p) => {
      const idx = Number(p._id.split("-")[1]);
      const isExPan = p._id === "pan-1";

      // Panchayat weather observations (14 days). Synthetic: downscaled regional truth plus small deterministic noise.
      const truthAt = {};
      for (let i = 13; i >= 0; i--) {
        const rt = regionalTrue(bIdx, i, isExample);
        const r = rng(idx * 1000 + i);
        const n = (a) => (r() - 0.5) * 2 * a;
        const d = downscale({ ...rt, tempMinC: rt.tempC - 3.9, tempMaxC: rt.tempC + 2.1, rainProbabilityPct: 50 }, featOf(p), ref).values;
        const noisy = isExPan ? { temperatureC: d.temperatureC, humidityPct: d.humidityPct, windKmh: d.windKmh, rainfallMm: EX_RAIN[i], cloudCoverPct: d.cloudCoverPct }
          : { temperatureC: Math.round((d.temperatureC + n(0.6)) * 10) / 10, humidityPct: Math.round(clamp(d.humidityPct + n(3), 20, 99)), windKmh: Math.round(Math.max(0, d.windKmh + n(2))), rainfallMm: Math.max(0, Math.round(d.rainfallMm * (1 + n(0.2)) * 10) / 10), cloudCoverPct: Math.round(clamp(d.cloudCoverPct + n(5), 0, 100)) };
        truthAt[i] = noisy;
        obs.push({ panchayat: p._id, observedAt: new Date(now.getTime() - i * DAY).toISOString(), ...noisy, source: "DEMO" });
      }

      // Downscaled forecasts for the next 5 days, with the full explanation retained.
      for (let d = 0; d < 5; d++) {
        const rf = regFc[d];
        const out = downscale(rf, featOf(p), ref);
        const v = out.values;
        fcs.push({
          panchayat: p._id, forDate: new Date(now.getTime() + d * DAY).toISOString(),
          rainProbabilityPct: v.rainProbabilityPct, expectedRainfallMinMm: v.expectedRainfallMinMm, expectedRainfallMaxMm: v.expectedRainfallMaxMm, rainfallMm: v.rainfallMm,
          temperatureC: v.temperatureC, temperatureMinC: Math.round(v.temperatureMinC), temperatureMaxC: Math.round(v.temperatureMaxC),
          humidityPct: v.humidityPct, windKmh: v.windKmh, cloudCoverPct: v.cloudCoverPct, source: "DEMO", method: "RULE_BASED_DEMONSTRATION",
          regional: { tempC: Math.round(rf.tempC * 10) / 10, tempMinC: Math.round(rf.tempMinC * 10) / 10, tempMaxC: Math.round(rf.tempMaxC * 10) / 10, humidityPct: Math.round(rf.humidityPct), windKmh: Math.round(rf.windKmh), rainfallMm: Math.round(rf.rainfallMm * 10) / 10, rainProbabilityPct: Math.round(rf.rainProbabilityPct), cloudCoverPct: Math.round(rf.cloudCoverPct) },
          adjustments: out.adjustments, uncertainty: out.uncertainty, elevationDeltaM: out.elevationDeltaM, coastFactor: out.coastFactor,
        });
      }

      // Verification: past regional forecasts (with error) -> downscaled prediction vs actual Panchayat observation.
      for (let i = 1; i <= 10; i++) {
        const rt = regionalTrue(bIdx, i, isExample);
        const r = rng(idx * 7000 + i);
        const n = (a) => (r() - 0.5) * 2 * a;
        const fcRain = Math.max(0, Math.round(rt.rainfallMm * (1 + n(0.3)) * 10) / 10);
        const rf = { tempC: rt.tempC + n(1.2), humidityPct: rt.humidityPct + n(5), windKmh: Math.max(0, rt.windKmh + n(3)), cloudCoverPct: rt.cloudCoverPct + n(8), rainfallMm: fcRain, rainProbabilityPct: probFromRain(fcRain) };
        rf.tempMinC = rf.tempC - 3.9; rf.tempMaxC = rf.tempC + 2.1;
        const pred = downscale(rf, featOf(p), ref).values;
        ver.push({
          panchayat: p._id, block, district, date: new Date(now.getTime() - i * DAY).toISOString(),
          predictedRainfallMm: pred.rainfallMm, regionalRainfallMm: Math.round(fcRain * 10) / 10, actualRainfallMm: truthAt[i].rainfallMm,
          predictedTemperatureC: pred.temperatureC, regionalTemperatureC: Math.round(rf.tempC * 10) / 10, actualTemperatureC: truthAt[i].temperatureC, source: "DEMO",
        });
      }
    });
  });

  collections.weatherObservations.insertMany(obs);
  collections.weatherForecasts.insertMany(fcs);
  collections.regionalForecasts.insertMany(regional);
  collections.forecastVerifications.insertMany(ver);

  collections.modelMetrics.create({
    modelName: "Rule-based geographic downscaling (demonstration)", kind: "RULE_BASED_DEMONSTRATION", evaluatedOn: now.toISOString(), sampleSize: ver.length,
    notes: "Not a trained model. Verification uses synthetic observations, so results demonstrate the workflow, not real-world skill.",
  });

  // ----- Risk status and alerts derived from the seeded weather (not hand-typed) -----
  const { rainMemory } = require("../services/weatherData");
  const startTime = now.toISOString();
  const alerts = [];
  panchayats.forEach((p) => {
    const rm = rainMemory(p._id);
    const today = obs.filter((o) => o.panchayat === p._id).slice(-1)[0];
    let risk = rm ? rm.risk : "NORMAL";
    if (rm && rm.risk === "HIGH_RISK") alerts.push({ panchayat: p._id, alertType: "HEAVY_RAIN", severity: rm.last7dMm >= 120 ? "HIGH" : "MODERATE", startTime, expectedDurationHours: 12, recommendedAttention: "Recent rainfall is already high and more rain is expected. Delay fertilizer application and keep drainage channels open.", active: true });
    if (today && today.windKmh >= 27) { alerts.push({ panchayat: p._id, alertType: "STRONG_WIND", severity: "LOW", startTime, expectedDurationHours: 6, recommendedAttention: "Postpone spraying until the wind speed drops.", active: true }); if (risk === "NORMAL") risk = "CAUTION"; }
    collections.panchayats.updateById(p._id, { riskLevel: risk });
  });
  collections.alerts.insertMany(alerts);

  collections.advisories.create({
    panchayat: "pan-1", crop: "Paddy", cropStage: "Vegetative", title: "Rain expected this evening",
    body: "Recent rainfall is already high and more rain is expected. Delay fertilizer application and check field drainage.", createdBy: "user-officer-demo",
  });

  const hash = bcrypt.hashSync("Demo@12345", 8);
  collections.users.insertMany([
    { _id: "user-farmer-demo", name: "Murugan (Demo Farmer)", phone: "9999900001", email: "farmer@demo.local", passwordHash: hash, role: "FARMER", district: "Tiruvallur", block: "Example Block", panchayat: "pan-1", crop: "Paddy", cropStage: "Vegetative", language: "en", isDemoAccount: true },
    { _id: "user-officer-demo", name: "Agriculture Officer (Demo)", phone: "9999900002", email: "officer@demo.local", passwordHash: hash, role: "OFFICER", district: "Tiruvallur", block: "Example Block", panchayat: null, crop: "", cropStage: "", language: "en", isDemoAccount: true },
  ]);

  const snapshot = obs.filter((o) => o.panchayat === "pan-1").slice(-1)[0];
  [["Paddy", "Vegetative"], ["Tomato", "Fruiting"]].forEach(([crop, cropStage], k) => {
    collections.farmerPhotoRiskChecks.create({
      farmer: "user-farmer-demo", panchayat: "pan-1", crop, cropStage, photoUrl: LEAF_SVG, isSample: true,
      weatherSnapshot: { temperatureC: snapshot.temperatureC, humidityPct: snapshot.humidityPct, windKmh: snapshot.windKmh, rainfall3dMm: 66, source: "DEMO" },
      analysisResult: evaluatePhotoRisk({ crop, cropStage, weather: { ...snapshot, rainfallMm: 66 } }),
      officerReviewed: false, officerNote: "", reviewStatus: "PENDING", createdAt: new Date(now.getTime() - (k + 1) * 3600 * 1000).toISOString(),
    });
  });
};
