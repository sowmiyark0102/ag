/**
 * Transparent, rule-based DEMONSTRATION downscaling.
 *
 * Converts a coarse regional (block/grid-cell) weather value into a Panchayat-level estimate using
 * documented geographic adjustments. Every adjustment is returned with its numeric contribution so the
 * result can be explained exactly. This is NOT a trained machine-learning model and no real-world accuracy
 * is claimed. Uncertainty widths are nominal (rule-based), not statistically calibrated.
 */
const CONSTANTS = {
  lapseRateCPerKm: 6.5,          // temperature falls ~6.5 C per km of elevation gain
  coastalInfluenceKm: 40,        // sea influence fades linearly to zero at this distance
  coastalTemperatureC: -0.5,     // mild sea moderation of mean temperature at the coast
  coastalHumidityPct: 8,         // humidity boost at the coast
  coastalWindFraction: 0.25,     // wind speed boost at the coast (fraction of regional wind)
  coastalRainFraction: 0.06,     // rainfall enhancement at the coast (fraction of regional rain)
  coastalRainProbPts: 3,
  waterBodyTemperatureC: -0.3,
  waterBodyHumidityPct: 3,
  waterBodyRainProbPts: 2,
  orographicRainPer100m: 0.09,   // +9% rain per +100 m relative to the regional cell mean
  rainFactorMin: 0.6,
  rainFactorMax: 1.5,
  rainProbPtsPer100m: 5,
  humidityPctPer100m: -1,
  windFractionPer100m: 0.06,
  cloudPtsPer100m: 3,
  rainUncertaintyBase: 0.26,
};

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const r1 = (v) => Math.round(v * 10) / 10;
const r2 = (v) => Math.round(v * 100) / 100;

function coastFactor(distKm) {
  return clamp(1 - distKm / CONSTANTS.coastalInfluenceKm, 0, 1);
}

/** reg: {tempC,tempMinC,tempMaxC,humidityPct,windKmh,rainfallMm,rainProbabilityPct,cloudCoverPct}; feat: {elevationM,coastDistanceKm,nearWaterBody}; refElevationM: regional cell mean elevation */
function downscale(reg, feat, refElevationM) {
  const C = CONSTANTS;
  const dElev = feat.elevationM - refElevationM;
  const cf = coastFactor(feat.coastDistanceKm);
  const water = feat.nearWaterBody ? 1 : 0;
  const adj = [];
  const add = (variable, factor, label, delta, unit, why) => { if (Math.abs(delta) >= 0.005) adj.push({ variable, factor, label, delta: r2(delta), unit, explanation: why }); };

  // Temperature
  const tElev = -C.lapseRateCPerKm * (dElev / 1000);
  const tCoast = C.coastalTemperatureC * cf;
  const tWater = C.waterBodyTemperatureC * water;
  add("temperature", "elevation", "Elevation vs regional cell", tElev, "°C", `${Math.round(dElev)} m relative to the regional cell mean; ${C.lapseRateCPerKm} °C per km lapse rate.`);
  add("temperature", "coast", "Distance to coast", tCoast, "°C", `${feat.coastDistanceKm} km from the coast; sea moderation fades to zero at ${C.coastalInfluenceKm} km.`);
  add("temperature", "water", "Nearby water body", tWater, "°C", "A nearby lake/reservoir slightly cools the local mean.");
  const tDelta = tElev + tCoast + tWater;

  // Rainfall (mm)
  const R0 = reg.rainfallMm;
  const oroFactor = clamp(1 + (C.orographicRainPer100m * dElev) / 100, C.rainFactorMin, C.rainFactorMax);
  const rOro = R0 * (oroFactor - 1);
  const rCoast = R0 * C.coastalRainFraction * cf;
  add("rainfall", "elevation", "Orographic effect (elevation)", rOro, "mm", `Higher ground tends to receive more rain; ${Math.round(C.orographicRainPer100m * 100)}% per 100 m, bounded ${C.rainFactorMin}-${C.rainFactorMax}x.`);
  add("rainfall", "coast", "Coastal enhancement", rCoast, "mm", "Slight rainfall enhancement near the sea.");
  const rain = Math.max(0, R0 + rOro + rCoast);

  // Rain probability (percentage points)
  const pElev = (C.rainProbPtsPer100m * dElev) / 100;
  const pCoast = C.coastalRainProbPts * cf;
  const pWater = C.waterBodyRainProbPts * water;
  add("rainProbability", "elevation", "Elevation vs regional cell", pElev, "pts", `${C.rainProbPtsPer100m} percentage points per 100 m.`);
  add("rainProbability", "coast", "Distance to coast", pCoast, "pts", "Sea influence raises rain chance slightly.");
  add("rainProbability", "water", "Nearby water body", pWater, "pts", "Local moisture source.");
  const prob = clamp(reg.rainProbabilityPct + pElev + pCoast + pWater, 2, 98);

  // Humidity
  const hElev = (C.humidityPctPer100m * dElev) / 100;
  const hCoast = C.coastalHumidityPct * cf;
  const hWater = C.waterBodyHumidityPct * water;
  add("humidity", "elevation", "Elevation vs regional cell", hElev, "pts", "Air is slightly drier at higher elevation.");
  add("humidity", "coast", "Distance to coast", hCoast, "pts", "Moist sea air near the coast.");
  add("humidity", "water", "Nearby water body", hWater, "pts", "Local moisture source.");
  const hum = clamp(reg.humidityPct + hElev + hCoast + hWater, 5, 100);

  // Wind
  const wElev = reg.windKmh * ((C.windFractionPer100m * dElev) / 100);
  const wCoast = reg.windKmh * C.coastalWindFraction * cf;
  add("wind", "elevation", "Elevation vs regional cell", wElev, "km/h", "Exposed higher ground is windier.");
  add("wind", "coast", "Distance to coast", wCoast, "km/h", "Less friction near open water.");
  const wind = Math.max(0, reg.windKmh + wElev + wCoast);

  // Cloud cover
  const cElev = (C.cloudPtsPer100m * dElev) / 100;
  add("cloudCover", "elevation", "Elevation vs regional cell", cElev, "pts", "Cloud tends to build over higher ground.");
  const cloud = clamp(reg.cloudCoverPct + cElev, 0, 100);

  const rainFrac = clamp(C.rainUncertaintyBase + 0.1 * cf + (0.1 * Math.abs(dElev)) / 100, 0.15, 0.7);
  const uncertainty = {
    kind: "NOMINAL_RULE_BASED",
    temperatureC: r1(1 + (0.5 * Math.abs(dElev)) / 100 + 0.5 * cf),
    rainProbabilityPts: r1(8 + (4 * Math.abs(dElev)) / 100),
    rainfallFraction: r2(rainFrac),
    note: "Nominal widths from documented rules. They are not statistically calibrated confidence intervals.",
  };

  const local = {
    temperatureC: r1(reg.tempC + tDelta),
    temperatureMinC: r1(reg.tempMinC + tDelta),
    temperatureMaxC: r1(reg.tempMaxC + tDelta),
    humidityPct: Math.round(hum),
    windKmh: Math.round(wind),
    rainfallMm: r1(rain),
    rainProbabilityPct: Math.round(prob),
    cloudCoverPct: Math.round(cloud),
    expectedRainfallMinMm: Math.max(0, Math.round(rain * (1 - rainFrac))),
    expectedRainfallMaxMm: Math.max(1, Math.round(rain * (1 + rainFrac))),
  };
  return { values: local, adjustments: adj, uncertainty, elevationDeltaM: Math.round(dElev), coastFactor: r2(cf) };
}

module.exports = { downscale, CONSTANTS };
