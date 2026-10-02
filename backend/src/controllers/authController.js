const bcrypt = require("bcryptjs");
const ApiError = require("../utils/apiError");
const { signToken } = require("../utils/jwt");
const asyncHandler = require("../middleware/asyncHandler");
const { collections, seedIfNeeded } = require("../data/store");

const PHONE_RE = /^[0-9+\- ]{8,15}$/;

exports.register = asyncHandler(async (req, res) => {
  seedIfNeeded();
  const { name, phone, password, district, block, panchayatId, crop, cropStage, language } = req.body || {};
  if (!name || !phone || !password) throw new ApiError(400, "Name, phone and password are required.", "VALIDATION_ERROR");
  if (!PHONE_RE.test(String(phone))) throw new ApiError(400, "Enter a valid phone number.", "VALIDATION_ERROR");
  if (String(password).length < 8) throw new ApiError(400, "Password must be at least 8 characters.", "VALIDATION_ERROR");
  // Public registration always creates FARMER accounts. Officer accounts are provisioned by administrators.
  if (collections.users.findOne((u) => u.phone === phone)) throw new ApiError(409, "An account with this phone number already exists.", "DUPLICATE_USER");

  const user = collections.users.create({
    name: String(name).slice(0, 80), phone: String(phone), passwordHash: await bcrypt.hash(String(password), 10), role: "FARMER",
    district: district || "", block: block || "", panchayat: panchayatId || null, crop: crop || "", cropStage: cropStage || "", language: language || "en", isDemoAccount: false,
  });
  res.status(201).json({ success: true, token: signToken(user), user: sanitizeUser(user) });
});

exports.login = asyncHandler(async (req, res) => {
  seedIfNeeded();
  const { phone, password } = req.body || {};
  if (!phone || !password) throw new ApiError(400, "Phone and password are required.", "VALIDATION_ERROR");
  const user = collections.users.findOne((u) => u.phone === String(phone));
  if (!user || !(await bcrypt.compare(String(password), user.passwordHash))) {
    throw new ApiError(401, "Invalid phone number or password.", "INVALID_CREDENTIALS");
  }
  res.json({ success: true, token: signToken(user), user: sanitizeUser(user) });
});

exports.me = asyncHandler(async (req, res) => res.json({ success: true, user: sanitizeUser(req.user) }));

exports.updateProfile = asyncHandler(async (req, res) => {
  const allowed = ["name", "district", "block", "panchayat", "crop", "cropStage", "language"];
  const updates = {};
  for (const key of allowed) if (req.body && req.body[key] !== undefined) updates[key] = req.body[key];
  if (updates.name !== undefined) updates.name = String(updates.name).slice(0, 80);
  let user = collections.users.updateById(req.user._id, updates);
  if (!user) user = collections.users.create({ ...req.user, ...updates });
  res.json({ success: true, user: sanitizeUser(user) });
});

function sanitizeUser(u) {
  return { id: u._id, name: u.name, phone: u.phone, role: u.role, district: u.district, block: u.block, panchayat: u.panchayat, crop: u.crop, cropStage: u.cropStage, isDemoAccount: !!u.isDemoAccount };
}
