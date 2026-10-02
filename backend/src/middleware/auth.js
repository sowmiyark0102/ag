const { verifyToken } = require("../utils/jwt");
const ApiError = require("../utils/apiError");
const { collections, seedIfNeeded } = require("../data/store");

// Works on long-running servers and on serverless platforms: if this instance does not know the user
// (e.g. registered on another instance) we trust the signed token's claims.
async function requireAuth(req, res, next) {
  try {
    seedIfNeeded();
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) throw new ApiError(401, "Please log in to continue.", "UNAUTHENTICATED");
    const payload = verifyToken(token);
    const user =
      collections.users.findById(payload.id) ||
      { _id: payload.id, role: payload.role, name: payload.name, phone: payload.phone, district: "", block: "", panchayat: null, crop: "", cropStage: "" };
    if (!["FARMER", "OFFICER"].includes(user.role)) throw new ApiError(401, "Invalid session.", "UNAUTHENTICATED");
    req.user = user;
    next();
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    next(new ApiError(401, "Your session is no longer valid. Please log in again.", "UNAUTHENTICATED"));
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, "You do not have permission to perform this action.", "FORBIDDEN"));
    }
    next();
  };
}

// Optional auth: attaches req.user when a valid token exists, never fails.
function optionalAuth(req, res, next) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return next();
  try {
    const p = verifyToken(header.slice(7));
    req.user = collections.users.findById(p.id) || { _id: p.id, role: p.role, name: p.name, phone: p.phone };
  } catch (e) { /* ignore */ }
  next();
}

module.exports = { requireAuth, requireRole, optionalAuth };
