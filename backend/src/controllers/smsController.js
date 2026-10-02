const asyncHandler = require("../middleware/asyncHandler");
const ApiError = require("../utils/apiError");
const { collections, seedIfNeeded } = require("../data/store");
const { latestObservation, currentForecast, rainMemory } = require("../services/weatherData");
const { evaluateFarmActivity } = require("../engines/weatherDecisionEngine");
const { getStageGuide } = require("../data/cropStageData");
const M = require("../services/messages");

const CROPS = ["Paddy", "Groundnut", "Maize", "Tomato", "Banana", "Sugarcane"];
const STAGES = ["Seedling", "Vegetative", "Flowering", "Fruiting", "Harvest"];

exports.simulateSms = asyncHandler(async (req, res) => {
  seedIfNeeded();
  const body = req.body || {};
  const raw = String(body.message || body.keyword || "").trim();
  if (!raw) throw new ApiError(400, "Send a keyword: WEATHER, RAIN, ADVISORY, ALERT, FARM or HELP.", "VALIDATION_ERROR");
  const lang = body.language === "ta" ? "ta" : "en";
  const pid = body.panchayatId && collections.panchayats.findById(body.panchayatId) ? body.panchayatId : "pan-1";
  const crop = CROPS.includes(body.crop) ? body.crop : "Paddy";
  const stage = STAGES.includes(body.cropStage) ? body.cropStage : "Vegetative";
  const keyword = raw.split(/\s+/)[0].toUpperCase().slice(0, 12);

  const weather = latestObservation(pid);
  const forecast = currentForecast(pid);
  const rm = rainMemory(pid);
  const strip = (s) => s.replace(/ To hear the menu press 0\..*$/s, "").replace(/ மெனுவைக் கேட்க 0.*$/s, "");
  let reply;
  switch (keyword) {
    case "WEATHER": reply = strip(M.weatherMsg(lang, weather, forecast)); break;
    case "RAIN": reply = strip(M.rainMsg(lang, forecast)); break;
    case "ADVISORY": case "ADVICE": reply = M.advisoryMsg(lang, crop, stage, getStageGuide(crop, stage)); break;
    case "ALERT": case "ALERTS": reply = strip(M.alertsMsg(lang, collections.alerts.find((a) => a.active && a.panchayat === pid))); break;
    case "FARM": {
      const acts = ["SOWING", "SPRAYING", "FERTILIZER_APPLICATION", "IRRIGATION"];
      reply = strip(M.farmMsg(lang, crop, stage, acts.map((a) => ({ activity: a, result: evaluateFarmActivity({ weather, forecast, activity: a, recentRainMm: rm ? rm.last3dMm : undefined, crop, cropStage: stage }) }))));
      break;
    }
    case "HELP": reply = M.pick(lang, "AgriCast SMS: send WEATHER, RAIN, ADVISORY, ALERT or FARM.", "அக்ரிகாஸ்ட் SMS: WEATHER, RAIN, ADVISORY, ALERT அல்லது FARM என அனுப்புங்கள்."); break;
    default: reply = M.pick(lang, "Unknown keyword. Send WEATHER, RAIN, ADVISORY, ALERT, FARM or HELP.", "தெரியாத சொல். WEATHER, RAIN, ADVISORY, ALERT, FARM அல்லது HELP அனுப்புங்கள்.");
  }
  res.json({ success: true, keyword, reply, language: lang, prototypeNotice: "SMS PROTOTYPE - SMS delivery is simulated in this prototype." });
});
