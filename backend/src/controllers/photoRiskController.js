const ApiError = require("../utils/apiError");
const asyncHandler = require("../middleware/asyncHandler");
const { evaluatePhotoRisk } = require("../engines/photoRiskEngine");
const { collections, seedIfNeeded } = require("../data/store");
const { latestObservation, rainMemory } = require("../services/weatherData");
const { detectImageType } = require("../middleware/upload");

const CROPS = ["Paddy", "Groundnut", "Maize", "Tomato", "Banana", "Sugarcane"];
const STAGES = ["Seedling", "Vegetative", "Flowering", "Fruiting", "Harvest"];
const STATUSES = ["VERIFIED", "NEEDS_INSPECTION"];

const pickFarmer = (u) => (u ? { _id: u._id, name: u.name, phone: u.phone } : null);
const withRefs = (r) => ({ ...r, farmer: pickFarmer(collections.users.findById(r.farmer)) || { _id: r.farmer, name: "Farmer", phone: "" }, panchayat: collections.panchayats.findById(r.panchayat) });

exports.submitPhotoRisk = asyncHandler(async (req, res) => {
  seedIfNeeded();
  const { panchayatId, crop, cropStage } = req.body || {};
  if (!panchayatId || !crop || !cropStage) throw new ApiError(400, "Panchayat, crop and crop stage are required.", "VALIDATION_ERROR");
  if (!collections.panchayats.findById(panchayatId)) throw new ApiError(404, "Panchayat not found.", "NOT_FOUND");
  if (!CROPS.includes(crop) || !STAGES.includes(cropStage)) throw new ApiError(400, "Unknown crop or crop stage.", "VALIDATION_ERROR");
  if (!req.file) throw new ApiError(400, "A crop photograph is required.", "VALIDATION_ERROR");
  const type = detectImageType(req.file.buffer);
  if (!type) throw new ApiError(400, "The uploaded file is not a valid JPEG, PNG or WEBP image.", "INVALID_FILE_TYPE");

  const observation = latestObservation(panchayatId);
  const rm = rainMemory(panchayatId);
  const weather = observation ? { ...observation, rainfallMm: rm ? rm.last3dMm : observation.rainfallMm } : null;
  const analysisResult = evaluatePhotoRisk({ crop, cropStage, weather });

  const record = collections.farmerPhotoRiskChecks.create({
    farmer: req.user._id, panchayat: panchayatId, crop, cropStage,
    photoUrl: `data:${type};base64,${req.file.buffer.toString("base64")}`,
    weatherSnapshot: observation ? { temperatureC: observation.temperatureC, humidityPct: observation.humidityPct, windKmh: observation.windKmh, rainfall3dMm: rm ? rm.last3dMm : null, source: observation.source } : {},
    analysisResult, officerReviewed: false, officerNote: "", reviewStatus: "PENDING",
  });
  res.status(201).json({ success: true, record });
});

exports.myHistory = asyncHandler(async (req, res) => {
  seedIfNeeded();
  const records = collections.farmerPhotoRiskChecks.find((r) => r.farmer === req.user._id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(withRefs);
  res.json({ success: true, records });
});

exports.officerList = asyncHandler(async (req, res) => {
  seedIfNeeded();
  const records = collections.farmerPhotoRiskChecks.find().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(withRefs);
  res.json({ success: true, records });
});

exports.officerReview = asyncHandler(async (req, res) => {
  const { note, status } = req.body || {};
  const prev = collections.farmerPhotoRiskChecks.findById(req.params.id);
  if (!prev) throw new ApiError(404, "Submission not found.", "NOT_FOUND");
  const reviewStatus = STATUSES.includes(status) ? status : "VERIFIED";
  const record = collections.farmerPhotoRiskChecks.updateById(req.params.id, { officerReviewed: true, officerNote: String(note || "").slice(0, 300), reviewStatus, reviewedBy: req.user._id });
  collections.auditLogs.create({ user: req.user._id, role: req.user.role, action: "REVIEW_FARMER_REPORT", target: record._id, previousValue: { reviewStatus: prev.reviewStatus || "PENDING" }, newValue: { reviewStatus, note: record.officerNote } });
  res.json({ success: true, record: withRefs(record) });
});
