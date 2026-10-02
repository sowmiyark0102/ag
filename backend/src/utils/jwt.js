const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "dev_only_secret_change_me";

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role, name: user.name, phone: user.phone }, JWT_SECRET, { expiresIn: "7d" });
}
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
module.exports = { signToken, verifyToken };
