/**
 * Geographic feature engineering (demonstration).
 * - Distance to coast is COMPUTED from coordinates against an approximate east-coast polyline.
 * - Elevation values in seed data are approximate demonstration numbers. Replace them with SRTM/DEM
 *   sampled values for a real deployment.
 */
const COAST = [
  [13.6, 80.2], [13.42, 80.32], [13.08, 80.29], [12.62, 80.19], [11.93, 79.83], [11.75, 79.77],
  [10.77, 79.85], [10.3, 79.87], [9.28, 79.3], [8.8, 78.15], [8.08, 77.55],
];

const R = 6371;
const rad = (d) => (d * Math.PI) / 180;
function haversineKm(lat1, lng1, lat2, lng2) {
  const dLat = rad(lat2 - lat1), dLng = rad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function distanceToCoastKm(lat, lng) {
  let best = Infinity;
  for (let i = 0; i < COAST.length - 1; i++) {
    const [a1, b1] = COAST[i], [a2, b2] = COAST[i + 1];
    for (let s = 0; s <= 40; s++) {
      const t = s / 40;
      best = Math.min(best, haversineKm(lat, lng, a1 + (a2 - a1) * t, b1 + (b2 - b1) * t));
    }
  }
  return +best.toFixed(1);
}

module.exports = { distanceToCoastKm, haversineKm };
