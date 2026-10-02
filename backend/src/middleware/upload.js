const multer = require("multer");
const path = require("path");
const ApiError = require("../utils/apiError");

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_EXT = [".jpg", ".jpeg", ".png", ".webp"];
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB (the web app compresses photos before upload)

// Memory storage: works on serverless hosts (read-only disk) and never writes uploaded files to disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE_BYTES, files: 1 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    if (!ALLOWED_MIME.includes(file.mimetype) || (ext && !ALLOWED_EXT.includes(ext))) {
      return cb(new ApiError(400, "Only JPEG, PNG or WEBP images are accepted.", "INVALID_FILE_TYPE"));
    }
    cb(null, true);
  },
});

// Verify the real file signature, not just the declared MIME type.
function detectImageType(buf) {
  if (!buf || buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.slice(0, 4).toString() === "RIFF" && buf.slice(8, 12).toString() === "WEBP") return "image/webp";
  return null;
}

module.exports = upload;
module.exports.detectImageType = detectImageType;
