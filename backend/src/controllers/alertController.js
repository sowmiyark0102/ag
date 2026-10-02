const ApiError = require("../utils/apiError");
const asyncHandler = require("../middleware/asyncHandler");
const { collections, seedIfNeeded } = require("../data/store");

const TYPES = ["HEAVY_RAIN", "EXTREME_HEAT", "STRONG_WIND", "FLOOD_RISK", "DROUGHT_RISK"];
const SEVERITIES = ["LOW", "MODERATE", "HIGH"];
const withPanchayat = (a) => ({ ...a, panchayat: collections.panchayats.findById(a.panchayat) });

exports.listAlerts = asyncHandler(async (req, res) => {
  seedIfNeeded();
  const { panchayatId, all } = req.query;
  let alerts = collections.alerts.find((a) => (all === "true" ? true : a.active));
  if (panchayatId) alerts = alerts.filter((a) => a.panchayat === panchayatId);
  alerts = alerts.sort((a, b) => new Date(b.startTime) - new Date(a.startTime)).map(withPanchayat);
  res.json({ success: true, alerts });
});

exports.createAlert = asyncHandler(async (req, res) => {
  const { panchayatId, alertType, severity, startTime, expectedDurationHours, recommendedAttention } = req.body || {};
  if (!panchayatId || !alertType) throw new ApiError(400, "Panchayat and alert type are required.", "VALIDATION_ERROR");
  if (!collections.panchayats.findById(panchayatId)) throw new ApiError(404, "Panchayat not found.", "NOT_FOUND");
  if (!TYPES.includes(alertType)) throw new ApiError(400, "Unknown alert type.", "VALIDATION_ERROR");
  if (severity && !SEVERITIES.includes(severity)) throw new ApiError(400, "Unknown severity.", "VALIDATION_ERROR");
  const start = startTime && !isNaN(new Date(startTime)) ? new Date(startTime).toISOString() : new Date().toISOString();
  const alert = collections.alerts.create({
    panchayat: panchayatId, alertType, severity: severity || "MODERATE", startTime: start,
    expectedDurationHours: Number(expectedDurationHours) > 0 ? Number(expectedDurationHours) : 6,
    recommendedAttention: String(recommendedAttention || "Follow local agricultural guidance and check your fields.").slice(0, 300),
    createdBy: req.user._id, active: true,
  });
  collections.auditLogs.create({ user: req.user._id, role: req.user.role, action: "CREATE_ALERT", target: alert._id, previousValue: null, newValue: alert });
  res.status(201).json({ success: true, alert: withPanchayat(alert) });
});

exports.deactivateAlert = asyncHandler(async (req, res) => {
  const prev = collections.alerts.findById(req.params.id);
  if (!prev) throw new ApiError(404, "Alert not found.", "NOT_FOUND");
  const alert = collections.alerts.updateById(req.params.id, { active: false });
  collections.auditLogs.create({ user: req.user._id, role: req.user.role, action: "CLOSE_ALERT", target: alert._id, previousValue: { active: true }, newValue: { active: false } });
  res.json({ success: true, alert: withPanchayat(alert) });
});
