const ApiError = require("../utils/apiError");
const asyncHandler = require("../middleware/asyncHandler");
const { calculateRiskSaved } = require("../engines/riskSavedEngine");
const { collections, seedIfNeeded } = require("../data/store");

exports.calculate = asyncHandler(async (req, res) => {
  seedIfNeeded();
  const { crop, activity, quantity, unitCost, assumedLossPercentage, recommendedAction, weatherReason } = req.body || {};
  const q = Number(quantity), c = Number(unitCost);
  if (!activity || !(q > 0) || !(c >= 0)) throw new ApiError(400, "Activity, a quantity above zero and a valid unit cost are required.", "VALIDATION_ERROR");
  const loss = assumedLossPercentage != null && assumedLossPercentage !== "" ? Number(assumedLossPercentage) : undefined;
  if (loss !== undefined && !(loss >= 0 && loss <= 100)) throw new ApiError(400, "Assumed loss must be between 0 and 100 percent.", "VALIDATION_ERROR");
  const result = calculateRiskSaved({ quantity: q, unitCost: c, assumedLossPercentage: loss });
  const record = collections.riskSavedCalculations.create({
    farmer: req.user._id, crop: crop || "", activity: String(activity).slice(0, 60), quantity: result.enteredQuantity, unitCost: result.unitCost,
    assumedLossPercentage: result.assumedLossPercentage, estimatedPotentialLoss: result.estimatedPotentialLoss,
    recommendedAction: String(recommendedAction || "").slice(0, 100), weatherReason: String(weatherReason || "").slice(0, 200),
  });
  res.status(201).json({ success: true, result, record });
});

exports.history = asyncHandler(async (req, res) => {
  seedIfNeeded();
  const records = collections.riskSavedCalculations.find((r) => r.farmer === req.user._id).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 20);
  res.json({ success: true, records });
});
