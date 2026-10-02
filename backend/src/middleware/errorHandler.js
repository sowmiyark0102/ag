const multer = require("multer");
const ApiError = require("../utils/apiError");

function notFoundHandler(req, res, next) {
  next(new ApiError(404, "The requested resource was not found.", "NOT_FOUND"));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let statusCode = 500;
  let code = "SERVER_ERROR";
  let message = "We're having trouble processing your request. Please try again.";
  if (err instanceof ApiError) { statusCode = err.statusCode; code = err.code; message = err.message; }
  else if (err instanceof multer.MulterError) { statusCode = 400; code = "UPLOAD_ERROR"; message = err.code === "LIMIT_FILE_SIZE" ? "The photo is too large. Please use a photo under 2 MB." : "The photo could not be uploaded."; }
  else if (err && err.type === "entity.parse.failed") { statusCode = 400; code = "BAD_JSON"; message = "The request could not be read."; }
  if (statusCode === 500) console.error(err); // full detail stays on the server
  res.status(statusCode).json({ success: false, message, code });
}
module.exports = { notFoundHandler, errorHandler };
