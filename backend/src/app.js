const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const app = express();
app.set("trust proxy", 1); // required behind Vercel/Render proxies for correct rate limiting

// CORS: CLIENT_ORIGIN may be a comma-separated list. If unset, any origin is allowed (safe here because
// authentication uses Bearer tokens, not cookies). Set it in production to restrict access.
const origins = (process.env.CLIENT_ORIGIN || "").split(",").map((s) => s.trim().replace(/\/$/, "")).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => cb(null, !origin || origins.length === 0 || origins.includes(origin) || /^http:\/\/localhost:\d+$/.test(origin)),
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}));
app.use(express.json({ limit: "1mb" }));

app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, max: 1000, standardHeaders: true, legacyHeaders: false }));
app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false }));

app.get("/", (req, res) => res.json({ success: true, service: "AgriCast AI backend", note: "Smart India Hackathon 2026 prototype", health: "/api/health" }));
app.get("/api/health", (req, res) => res.json({ success: true, message: "AgriCast AI backend is running.", dataMode: "in-memory demonstration data" }));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/panchayats", require("./routes/panchayatRoutes"));
app.use("/api/weather", require("./routes/weatherRoutes"));
app.use("/api/crops", require("./routes/cropRoutes"));
app.use("/api/decision", require("./routes/decisionRoutes"));
app.use("/api/alerts", require("./routes/alertRoutes"));
app.use("/api/advisory", require("./routes/advisoryRoutes"));
app.use("/api/voice", require("./routes/voiceRoutes"));
app.use("/api/sms", require("./routes/smsRoutes"));
app.use("/api/verification", require("./routes/verificationRoutes"));
app.use("/api/downscaling", require("./routes/downscalingRoutes"));
app.use("/api/model", require("./routes/modelRoutes"));
app.use("/api/data-quality", require("./routes/dataQualityRoutes"));
app.use("/api/farmer", require("./routes/farmerRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/risk-saved", require("./routes/riskSavedRoutes"));
app.use("/api/officer", require("./routes/officerRoutes"));

app.use(notFoundHandler);
app.use(errorHandler);
module.exports = app;
