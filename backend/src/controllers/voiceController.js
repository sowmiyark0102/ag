const asyncHandler = require("../middleware/asyncHandler");
const { collections, seedIfNeeded } = require("../data/store");
const { latestObservation, currentForecast, forecastsAsc, rainMemory } = require("../services/weatherData");
const { evaluateFarmActivity } = require("../engines/weatherDecisionEngine");
const { evaluateCropRisk } = require("../engines/cropRiskEngine");
const { getStageGuide } = require("../data/cropStageData");
const M = require("../services/messages");

const MENU = [
  { key: "1", en: "Today's Weather", ta: "இன்றைய வானிலை" },
  { key: "2", en: "Rain Forecast", ta: "மழை முன்னறிவிப்பு" },
  { key: "3", en: "Should I Farm Today?", ta: "இன்று விவசாயம் செய்யலாமா?" },
  { key: "4", en: "Crop Risk", ta: "பயிர் ஆபத்து" },
  { key: "5", en: "Irrigation Advice", ta: "நீர்ப்பாசன ஆலோசனை" },
  { key: "6", en: "Weather Alerts", ta: "வானிலை எச்சரிக்கைகள்" },
  { key: "7", en: "Repeat last message", ta: "மீண்டும் சொல்லவும்" },
  { key: "8", en: "Change language", ta: "மொழியை மாற்று" },
  { key: "9", en: "Tomorrow's forecast", ta: "நாளைய முன்னறிவிப்பு" },
  { key: "0", en: "Hear menu again", ta: "மெனுவை மீண்டும் கேள்" },
  { key: "#", en: "End call", ta: "அழைப்பை முடி" },
];
const CROPS = ["Paddy", "Groundnut", "Maize", "Tomato", "Banana", "Sugarcane"];
const STAGES = ["Seedling", "Vegetative", "Flowering", "Fruiting", "Harvest"];

exports.getMenu = asyncHandler(async (req, res) => {
  seedIfNeeded();
  const lang = req.query.language === "ta" ? "ta" : "en";
  const p = req.query.panchayatId ? collections.panchayats.findById(req.query.panchayatId) : null;
  res.json({
    success: true, menu: MENU, greeting: M.greeting(lang, p && p.name), menuPrompt: M.menuPrompt(lang),
    prototypeNotice: "IVR PROTOTYPE - Telephone service is not connected in this prototype.",
  });
});

exports.postSession = asyncHandler(async (req, res) => {
  seedIfNeeded();
  const body = req.body || {};
  let lang = body.language === "ta" ? "ta" : "en";
  const key = String(body.key || "").slice(0, 1);
  const pid = body.panchayatId && collections.panchayats.findById(body.panchayatId) ? body.panchayatId : "pan-1";
  const crop = CROPS.includes(body.crop) ? body.crop : "Paddy";
  const stage = STAGES.includes(body.cropStage) ? body.cropStage : "Vegetative";
  const lastText = typeof body.lastText === "string" ? body.lastText.slice(0, 1200) : "";

  const weather = latestObservation(pid);
  const forecast = currentForecast(pid);
  const rm = rainMemory(pid);
  const recent = rm ? rm.last3dMm : undefined;

  let text;
  let action = "SPEAK";
  switch (key) {
    case "1": text = M.weatherMsg(lang, weather, forecast); break;
    case "2": text = M.rainMsg(lang, forecast); break;
    case "3": {
      const acts = ["SOWING", "SPRAYING", "FERTILIZER_APPLICATION", "HARVESTING"];
      text = M.farmMsg(lang, crop, stage, acts.map((a) => ({ activity: a, result: evaluateFarmActivity({ weather, forecast, activity: a, recentRainMm: recent, crop, cropStage: stage }) })));
      break;
    }
    case "4": text = M.riskMsg(lang, crop, stage, evaluateCropRisk({ crop, cropStage: stage, weather, forecast, recentRainMm: recent })); break;
    case "5": text = M.irrigationMsg(lang, crop, stage, evaluateFarmActivity({ weather, forecast, activity: "IRRIGATION", recentRainMm: recent, crop, cropStage: stage }), getStageGuide(crop, stage)); break;
    case "6": text = M.alertsMsg(lang, collections.alerts.find((a) => a.active && a.panchayat === pid)); break;
    case "7": text = lastText || M.pick(lang, "There is no previous message to repeat. Press 0 to hear the menu.", "மீண்டும் சொல்ல முந்தைய செய்தி இல்லை. மெனுவைக் கேட்க 0 அழுத்தவும்."); break;
    case "8": lang = lang === "ta" ? "en" : "ta"; action = "LANGUAGE"; text = M.pick(lang, "Language changed to English. " + M.menuPrompt("en"), "மொழி தமிழுக்கு மாற்றப்பட்டது. " + M.menuPrompt("ta")); break;
    case "9": text = M.tomorrowMsg(lang, forecastsAsc(pid)); break;
    case "0": case "*": action = "MENU"; text = M.menuPrompt(lang); break;
    case "#": action = "END"; text = M.goodbye(lang); break;
    default: text = M.invalid(lang);
  }

  const session = collections.voiceSessions.create({ farmer: req.user ? req.user._id : null, menuOptionPressed: key, language: lang, responseText: text });
  res.json({ success: true, session: { id: session._id, key, language: lang, responseText: text, action } });
});
