/** Bilingual (English / Tamil) message builders shared by VoiceLine (IVR) and SMS. */
const L = (lang) => (lang === "ta" ? "ta" : "en");
const pick = (lang, en, ta) => (L(lang) === "ta" ? ta : en);

const STATUS = {
  SUITABLE: { en: "Suitable", ta: "ஏற்றது" },
  USE_CAUTION: { en: "Use caution", ta: "எச்சரிக்கையுடன்" },
  NOT_RECOMMENDED: { en: "Not recommended", ta: "பரிந்துரைக்கப்படவில்லை" },
  INSUFFICIENT_DATA: { en: "Not enough data", ta: "போதிய தகவல் இல்லை" },
};
const ACTIVITY = {
  SOWING: { en: "Sowing", ta: "விதைப்பு" },
  IRRIGATION: { en: "Irrigation", ta: "நீர்ப்பாசனம்" },
  SPRAYING: { en: "Spraying", ta: "மருந்து தெளித்தல்" },
  FERTILIZER_APPLICATION: { en: "Fertilizer", ta: "உரமிடுதல்" },
  HARVESTING: { en: "Harvesting", ta: "அறுவடை" },
  DRYING: { en: "Drying", ta: "உலர்த்துதல்" },
};
const RISK_TYPE = {
  HEAVY_RAIN: { en: "heavy rain", ta: "அதிக மழை" },
  WATERLOGGING: { en: "waterlogging", ta: "நீர் தேக்கம்" },
  DROUGHT: { en: "dry conditions", ta: "வறட்சி" },
  HEAT_STRESS: { en: "heat stress", ta: "வெப்ப அழுத்தம்" },
  STRONG_WIND: { en: "strong wind", ta: "பலத்த காற்று" },
  DISEASE_FAVOURABLE_WEATHER: { en: "weather favourable for fungal disease", ta: "பூஞ்சை நோய்க்கு சாதகமான வானிலை" },
  NONE: { en: "none", ta: "எதுவும் இல்லை" },
  UNKNOWN: { en: "unknown", ta: "தெரியவில்லை" },
};
const RISK_LEVEL = {
  LOW: { en: "low", ta: "குறைவு" },
  MODERATE: { en: "moderate", ta: "மிதம்" },
  HIGH: { en: "high", ta: "அதிகம்" },
  INSUFFICIENT_DATA: { en: "unknown", ta: "தெரியவில்லை" },
};
const ALERT = {
  HEAVY_RAIN: { en: "Heavy rain", ta: "அதிக மழை" },
  EXTREME_HEAT: { en: "Extreme heat", ta: "கடும் வெப்பம்" },
  STRONG_WIND: { en: "Strong wind", ta: "பலத்த காற்று" },
  FLOOD_RISK: { en: "Flood risk", ta: "வெள்ள அபாயம்" },
  DROUGHT_RISK: { en: "Drought risk", ta: "வறட்சி அபாயம்" },
};
const CROP_TA = { Paddy: "நெல்", Groundnut: "நிலக்கடலை", Maize: "மக்காச்சோளம்", Tomato: "தக்காளி", Banana: "வாழை", Sugarcane: "கரும்பு" };
const STAGE_TA = { Seedling: "நாற்று நிலை", Vegetative: "வளர்ச்சி நிலை", Flowering: "பூக்கும் நிலை", Fruiting: "காய்/கதிர் நிலை", Harvest: "அறுவடை நிலை" };
const cropName = (lang, c) => (L(lang) === "ta" ? CROP_TA[c] || c : c);
const stageName = (lang, s) => (L(lang) === "ta" ? STAGE_TA[s] || s : s);

const HINT = {
  en: " To hear the menu press 0. To repeat this message press 7.",
  ta: " மெனுவைக் கேட்க 0 அழுத்தவும். இந்த செய்தியை மீண்டும் கேட்க 7 அழுத்தவும்.",
};
const withHint = (lang, text) => text + HINT[L(lang)];

function menuPrompt(lang) {
  return pick(
    lang,
    "Press 1 for today's weather. Press 2 for rain forecast. Press 3 to know if you should farm today. Press 4 for crop risk. Press 5 for irrigation advice. Press 6 for weather alerts. Press 7 to repeat the last message. Press 8 to change language. Press 9 for tomorrow's forecast. Press 0 to hear this menu again. Press hash to end the call.",
    "இன்றைய வானிலைக்கு 1 அழுத்தவும். மழை முன்னறிவிப்புக்கு 2 அழுத்தவும். இன்று விவசாயம் செய்யலாமா என அறிய 3 அழுத்தவும். பயிர் ஆபத்துக்கு 4 அழுத்தவும். நீர்ப்பாசன ஆலோசனைக்கு 5 அழுத்தவும். வானிலை எச்சரிக்கைகளுக்கு 6 அழுத்தவும். கடைசி செய்தியை மீண்டும் கேட்க 7 அழுத்தவும். மொழியை மாற்ற 8 அழுத்தவும். நாளைய முன்னறிவிப்புக்கு 9 அழுத்தவும். இந்த மெனுவை மீண்டும் கேட்க 0 அழுத்தவும். அழைப்பை முடிக்க ஹாஷ் அழுத்தவும்."
  );
}
const greeting = (lang, panchayatName) =>
  pick(
    lang,
    `Welcome to AgriCast VoiceLine, the Smart India Hackathon prototype. Showing information for ${panchayatName || "your Panchayat"}.`,
    `அக்ரிகாஸ்ட் வாய்ஸ்லைனுக்கு வரவேற்கிறோம். இது ஒரு முன்மாதிரி சேவை. ${panchayatName || "உங்கள் ஊராட்சி"} தகவல் காட்டப்படுகிறது.`
  );
const goodbye = (lang) => pick(lang, "Thank you for calling AgriCast VoiceLine. Goodbye.", "அக்ரிகாஸ்ட் வாய்ஸ்லைனை அழைத்ததற்கு நன்றி. வணக்கம்.");
const invalid = (lang) => pick(lang, "Invalid option. Press 0 to hear the menu.", "தவறான தேர்வு. மெனுவைக் கேட்க 0 அழுத்தவும்.");
const noData = (lang) => pick(lang, "Weather information is not available for this Panchayat right now.", "இந்த ஊராட்சிக்கான வானிலை தகவல் தற்போது கிடைக்கவில்லை.");

function weatherMsg(lang, w, f) {
  if (!w) return noData(lang);
  const rain = f ? f.rainProbabilityPct : null;
  return withHint(lang, pick(
    lang,
    `Today's temperature is ${w.temperatureC} degrees Celsius. Humidity is ${w.humidityPct} percent. Wind speed is ${w.windKmh} kilometres per hour.${rain != null ? ` Rain probability is ${rain} percent.` : ""}`,
    `இன்றைய வெப்பநிலை ${w.temperatureC} டிகிரி செல்சியஸ். ஈரப்பதம் ${w.humidityPct} சதவீதம். காற்றின் வேகம் மணிக்கு ${w.windKmh} கிலோமீட்டர்.${rain != null ? ` மழை வாய்ப்பு ${rain} சதவீதம்.` : ""}`
  ));
}
function rainMsg(lang, f) {
  if (!f) return noData(lang);
  const likely = f.rainProbabilityPct >= 55;
  return withHint(lang, pick(
    lang,
    `${likely ? "Rain is expected in your Panchayat this evening." : "Rain is unlikely in your Panchayat today."} Rain probability is ${f.rainProbabilityPct} percent. Expected rainfall is ${f.expectedRainfallMinMm} to ${f.expectedRainfallMaxMm} millimetres.`,
    `${likely ? "உங்கள் ஊராட்சியில் இன்று மாலை மழை பெய்ய வாய்ப்புள்ளது." : "உங்கள் ஊராட்சியில் இன்று மழை பெய்ய வாய்ப்பு குறைவு."} மழை வாய்ப்பு ${f.rainProbabilityPct} சதவீதம். எதிர்பார்க்கப்படும் மழை ${f.expectedRainfallMinMm} முதல் ${f.expectedRainfallMaxMm} மில்லிமீட்டர்.`
  ));
}
function tomorrowMsg(lang, forecasts) {
  const f = forecasts && forecasts[1];
  if (!f) return noData(lang);
  return withHint(lang, pick(
    lang,
    `Tomorrow: rain probability ${f.rainProbabilityPct} percent, expected rainfall ${f.expectedRainfallMinMm} to ${f.expectedRainfallMaxMm} millimetres, temperature ${f.temperatureMinC} to ${f.temperatureMaxC} degrees.`,
    `நாளை: மழை வாய்ப்பு ${f.rainProbabilityPct} சதவீதம், எதிர்பார்க்கப்படும் மழை ${f.expectedRainfallMinMm} முதல் ${f.expectedRainfallMaxMm} மில்லிமீட்டர், வெப்பநிலை ${f.temperatureMinC} முதல் ${f.temperatureMaxC} டிகிரி.`
  ));
}
function farmMsg(lang, crop, stage, results) {
  if (!results.length || results[0].result.status === "INSUFFICIENT_DATA") return noData(lang);
  const parts = results.map((r) => `${ACTIVITY[r.activity][L(lang)]}: ${STATUS[r.result.status][L(lang)]}`);
  return withHint(lang, pick(
    lang,
    `For ${crop} at ${stage} stage today. ${parts.join(". ")}.`,
    `${cropName(lang, crop)}, ${stageName(lang, stage)}க்கான இன்றைய நிலை. ${parts.join(". ")}.`
  ));
}
function riskMsg(lang, crop, stage, risk) {
  if (!risk || risk.riskLevel === "INSUFFICIENT_DATA") return noData(lang);
  const lvl = RISK_LEVEL[risk.riskLevel][L(lang)];
  const typ = RISK_TYPE[risk.riskType] ? RISK_TYPE[risk.riskType][L(lang)] : risk.riskType;
  if (risk.riskType === "NONE") {
    return withHint(lang, pick(lang, `Crop risk for ${crop} is low. No elevated weather risk is expected. Continue routine monitoring.`, `${cropName(lang, crop)} பயிருக்கு ஆபத்து குறைவு. சாதாரண கண்காணிப்பைத் தொடருங்கள்.`));
  }
  return withHint(lang, pick(
    lang,
    `Crop risk for ${crop} at ${stage} stage is ${lvl}. Main concern: ${typ}. Please inspect the crop within 24 hours. This is a weather-based advisory, not a disease diagnosis.`,
    `${cropName(lang, crop)}, ${stageName(lang, stage)} பயிருக்கான ஆபத்து ${lvl}. முக்கிய கவலை: ${typ}. 24 மணி நேரத்திற்குள் பயிரை பரிசோதிக்கவும். இது வானிலை அடிப்படையிலான ஆலோசனை, நோய் கண்டறிதல் அல்ல.`
  ));
}
function irrigationMsg(lang, crop, stage, result, guide) {
  if (!result || result.status === "INSUFFICIENT_DATA") return noData(lang);
  const water = guide ? guide.waterNeed : "";
  const textEn = result.status === "SUITABLE" ? "Irrigation is suitable today." : result.status === "USE_CAUTION" ? "Check soil moisture before irrigating." : "Irrigation is not needed today because rain is likely or recent rainfall is high.";
  const textTa = result.status === "SUITABLE" ? "இன்று நீர்ப்பாசனம் செய்வது பொருத்தமானது." : result.status === "USE_CAUTION" ? "நீர்ப்பாசனம் செய்யும் முன் மண் ஈரத்தை சரிபார்க்கவும்." : "மழை வாய்ப்பு அல்லது சமீபத்திய மழை காரணமாக இன்று நீர்ப்பாசனம் தேவையில்லை.";
  return withHint(lang, pick(lang, `${textEn}${water ? ` Water need for ${crop} at ${stage} stage: ${water}.` : ""}`, `${textTa}`));
}
function alertsMsg(lang, alerts) {
  if (!alerts.length) return withHint(lang, pick(lang, "There are no active weather alerts for your Panchayat.", "உங்கள் ஊராட்சிக்கு தற்போது வானிலை எச்சரிக்கைகள் இல்லை."));
  const list = alerts.map((a) => `${ALERT[a.alertType] ? ALERT[a.alertType][L(lang)] : a.alertType}`).join(", ");
  const first = alerts[0].recommendedAttention || "";
  return withHint(lang, pick(lang, `There ${alerts.length === 1 ? "is 1 active alert" : `are ${alerts.length} active alerts`}: ${list}. ${first}`, `${alerts.length} செயலில் உள்ள எச்சரிக்கை: ${list}. கவனம்: வயல் வடிகாலை சரிபார்த்து, வானிலை மாறும் வரை உரம் மற்றும் மருந்து தெளிப்பதை தள்ளி வையுங்கள்.`));
}
function advisoryMsg(lang, crop, stage, guide) {
  if (!guide) return pick(lang, "No advisory is available for this crop stage.", "இந்த பயிர் நிலைக்கு ஆலோசனை இல்லை.");
  return pick(lang, `${crop} ${stage}: ${guide.advisory}`, `${cropName(lang, crop)} ${stageName(lang, stage)}: ${guide.advisoryTa}`);
}

module.exports = {
  L, pick, STATUS, ACTIVITY, ALERT, RISK_TYPE,
  menuPrompt, greeting, goodbye, invalid, noData,
  weatherMsg, rainMsg, tomorrowMsg, farmMsg, riskMsg, irrigationMsg, alertsMsg, advisoryMsg,
};
