const asyncHandler = require("../middleware/asyncHandler");
const { collections, seedIfNeeded } = require("../data/store");
const { rainMemory, currentForecast } = require("../services/weatherData");

exports.dashboard = asyncHandler(async (req, res) => {
  seedIfNeeded();
  const panchayats = collections.panchayats.find();
  const alerts = collections.alerts.find((a) => a.active);
  const affectedIds = new Set(alerts.map((a) => a.panchayat));
  panchayats.forEach((p) => { if (p.riskLevel !== "NORMAL") affectedIds.add(p._id); });

  const affected = panchayats.filter((p) => affectedIds.has(p._id)).map((p) => {
    const rm = rainMemory(p._id);
    const f = currentForecast(p._id);
    return { _id: p._id, name: p.name, block: p.block, district: p.district, riskLevel: p.riskLevel, rainProbabilityPct: f ? f.rainProbabilityPct : null, last3dMm: rm ? rm.last3dMm : null, activeAlerts: alerts.filter((a) => a.panchayat === p._id).length };
  });
  const reports = collections.farmerPhotoRiskChecks.find();
  res.json({
    success: true,
    metrics: {
      totalPanchayats: panchayats.length,
      activeAlerts: alerts.length,
      highRiskPanchayats: panchayats.filter((p) => p.riskLevel === "HIGH_RISK").length,
      rainfallEvents: collections.weatherObservations.count((o) => o.rainfallMm >= 20),
      cropRiskCases: reports.filter((r) => r.analysisResult && r.analysisResult.riskCategory !== "LOW").length,
      pendingReports: reports.filter((r) => !r.officerReviewed).length,
      forecastVerificationSamples: collections.forecastVerifications.count(),
    },
    affectedPanchayats: affected,
  });
});

exports.farmerReports = asyncHandler(async (req, res) => {
  seedIfNeeded();
  const records = collections.farmerPhotoRiskChecks.find().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((r) => {
    const u = collections.users.findById(r.farmer);
    return { ...r, farmer: u ? { _id: u._id, name: u.name, phone: u.phone } : { _id: r.farmer, name: "Farmer", phone: "" }, panchayat: collections.panchayats.findById(r.panchayat) };
  });
  res.json({ success: true, records });
});

exports.auditLogs = asyncHandler(async (req, res) => {
  const logs = collections.auditLogs.find().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 50).map((l) => {
    const u = collections.users.findById(l.user);
    return { ...l, userName: u ? u.name : "Officer" };
  });
  res.json({ success: true, logs });
});
