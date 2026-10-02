const ApiError = require("../utils/apiError");
const asyncHandler = require("../middleware/asyncHandler");
const { collections, seedIfNeeded } = require("../data/store");
const { nextReportId } = require("../engines/reportIdEngine");
const { detectImageType } = require("../middleware/upload");

const CATEGORIES = ["CROP_DAMAGE", "HEAVY_RAIN", "FLOODING", "WATER_SHORTAGE", "PEST_DISEASE", "IRRIGATION_PROBLEM", "WEATHER_DAMAGE", "SOIL_PROBLEM", "OTHER"];
const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const STATUSES = ["SUBMITTED", "ACKNOWLEDGED", "IN_PROGRESS", "RESOLVED", "CLOSED"];

function withFarmer(report) {
  const u = collections.users.findById(report.farmerId);
  return { ...report, farmerName: report.farmerName, farmerPhone: report.farmerPhone, farmerVillage: report.village, farmer: u ? { _id: u._id, name: u.name, phone: u.phone } : null };
}

// ---------- FARMER ----------

exports.createReport = asyncHandler(async (req, res) => {
  seedIfNeeded();
  const b = req.body || {};
  const { category, title, description, crop, village, panchayat, district, severity, incidentDate, latitude, longitude } = b;

  if (!category || !title || !description || !severity) {
    throw new ApiError(400, "Category, title, description and severity are required.", "VALIDATION_ERROR");
  }
  if (!CATEGORIES.includes(category)) throw new ApiError(400, "Unknown problem category.", "VALIDATION_ERROR");
  if (!SEVERITIES.includes(severity)) throw new ApiError(400, "Severity must be Low, Medium, High or Critical.", "VALIDATION_ERROR");

  let photoUrl = null;
  if (req.file) {
    const type = detectImageType(req.file.buffer);
    if (!type) throw new ApiError(400, "The uploaded file is not a valid JPEG, PNG or WEBP image.", "INVALID_FILE_TYPE");
    photoUrl = `data:${type};base64,${req.file.buffer.toString("base64")}`;
  }

  const reportId = nextReportId(collections.reports.count());

  // Farmer-submitted text is stored exactly as written — never rewritten or overwritten by any
  // translation step. The UI translates labels/status around it, not the farmer's own words.
  const report = collections.reports.create({
    reportId,
    farmerId: req.user._id,
    farmerName: req.user.name,
    farmerPhone: req.user.phone,
    category,
    title: String(title).slice(0, 150),
    description: String(description).slice(0, 2000),
    crop: crop || "",
    village: village || "",
    panchayat: panchayat || req.user.panchayat || "",
    district: district || req.user.district || "",
    severity,
    incidentDate: incidentDate && !isNaN(new Date(incidentDate)) ? new Date(incidentDate).toISOString() : new Date().toISOString(),
    latitude: latitude !== undefined && latitude !== "" ? Number(latitude) : null,
    longitude: longitude !== undefined && longitude !== "" ? Number(longitude) : null,
    photo: photoUrl,
    status: "SUBMITTED",
    officerId: null,
    officerResponse: "",
    statusHistory: [{ status: "SUBMITTED", at: new Date().toISOString(), by: req.user._id }],
  });

  res.status(201).json({ success: true, report });
});

exports.myReports = asyncHandler(async (req, res) => {
  seedIfNeeded();
  const reports = collections.reports.find((r) => r.farmerId === req.user._id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ success: true, reports });
});

exports.getMyReportById = asyncHandler(async (req, res) => {
  const report = collections.reports.findById(req.params.id);
  // Farmers may only ever see their OWN report - enforced server-side, not just hidden in the UI.
  if (!report || report.farmerId !== req.user._id) throw new ApiError(404, "Report not found.", "NOT_FOUND");
  res.json({ success: true, report });
});

// ---------- OFFICER ----------
// Jurisdiction: an officer sees reports from their own district (case-insensitive). If the officer
// record has no district configured, they fall back to seeing all reports (avoids an empty demo).

function officerScope(req) {
  const district = (req.user.district || "").trim().toLowerCase();
  return (r) => (district ? (r.district || "").trim().toLowerCase() === district : true);
}

exports.officerListReports = asyncHandler(async (req, res) => {
  seedIfNeeded();
  const { status } = req.query;
  let reports = collections.reports.find(officerScope(req));
  if (status && STATUSES.includes(status)) reports = reports.filter((r) => r.status === status);
  reports = reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(withFarmer);
  res.json({ success: true, reports, jurisdictionDistrict: req.user.district || null });
});

exports.officerGetReport = asyncHandler(async (req, res) => {
  seedIfNeeded();
  const report = collections.reports.findById(req.params.id);
  if (!report || !officerScope(req)(report)) throw new ApiError(404, "Report not found.", "NOT_FOUND");
  res.json({ success: true, report: withFarmer(report) });
});

exports.officerUpdateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body || {};
  if (!STATUSES.includes(status)) throw new ApiError(400, "Unknown status.", "VALIDATION_ERROR");
  const existing = collections.reports.findById(req.params.id);
  if (!existing || !officerScope(req)(existing)) throw new ApiError(404, "Report not found.", "NOT_FOUND");

  const history = [...(existing.statusHistory || []), { status, at: new Date().toISOString(), by: req.user._id }];
  const report = collections.reports.updateById(req.params.id, { status, officerId: req.user._id, statusHistory: history });

  collections.auditLogs.create({ user: req.user._id, role: req.user.role, action: "UPDATE_REPORT_STATUS", target: report._id, previousValue: { status: existing.status }, newValue: { status } });
  res.json({ success: true, report: withFarmer(report) });
});

exports.officerUpdateResponse = asyncHandler(async (req, res) => {
  const { response } = req.body || {};
  if (!response || !String(response).trim()) throw new ApiError(400, "Officer response cannot be empty.", "VALIDATION_ERROR");
  const existing = collections.reports.findById(req.params.id);
  if (!existing || !officerScope(req)(existing)) throw new ApiError(404, "Report not found.", "NOT_FOUND");

  const report = collections.reports.updateById(req.params.id, { officerResponse: String(response).slice(0, 1000), officerId: req.user._id });
  collections.auditLogs.create({ user: req.user._id, role: req.user.role, action: "ADD_OFFICER_RESPONSE", target: report._id, previousValue: null, newValue: { officerResponse: report.officerResponse } });
  res.json({ success: true, report: withFarmer(report) });
});

exports.officerReportMetrics = asyncHandler(async (req, res) => {
  seedIfNeeded();
  const reports = collections.reports.find(officerScope(req));
  res.json({
    success: true,
    metrics: {
      totalReports: reports.length,
      newReports: reports.filter((r) => r.status === "SUBMITTED").length,
      highPriority: reports.filter((r) => r.severity === "HIGH" || r.severity === "CRITICAL").length,
      inProgress: reports.filter((r) => r.status === "IN_PROGRESS" || r.status === "ACKNOWLEDGED").length,
      resolved: reports.filter((r) => r.status === "RESOLVED" || r.status === "CLOSED").length,
    },
  });
});

module.exports.CATEGORIES = CATEGORIES;
module.exports.SEVERITIES = SEVERITIES;
module.exports.STATUSES = STATUSES;
