/**
 * Crop-stage guidance. Each entry: advisory (en/ta), water need, weather risks the stage is
 * especially sensitive to, and what to monitor. General agronomic guidance for a demonstration
 * prototype - farmers should always follow local agricultural department advice.
 */
const S = (a, t, w, s, m) => ({ advisory: a, advisoryTa: t, waterNeed: w, sensitiveTo: s, monitor: m });

const STAGE_GUIDE = {
  Paddy: {
    Seedling: S("Keep the nursery moist with a thin water film. Heavy rain can wash out seedlings, so keep drainage channels open.", "நாற்றங்காலில் மெல்லிய நீர் மட்டத்தை வைத்திருங்கள். அதிக மழை நாற்றுகளை அடித்துச் செல்லலாம்; வடிகால் வாய்க்காலைத் திறந்து வைக்கவும்.", "Thin water film (about 1-2 cm)", ["HEAVY_RAIN", "STRONG_WIND"], "Check nursery bunds and drainage after every heavy shower."),
    Vegetative: S("Maintain 2-5 cm standing water. Avoid applying fertilizer just before forecast heavy rain, as it can wash away.", "வயலில் 2-5 செ.மீ நீர் நிற்கட்டும். அதிக மழை வரும் முன் உரமிடுவதைத் தவிர்க்கவும்; உரம் அடித்துச் செல்லப்படலாம்.", "2-5 cm standing water", ["HEAVY_RAIN", "DISEASE_FAVOURABLE_WEATHER"], "Inspect leaves for discolouration and check the field water level."),
    Flowering: S("Avoid water stress at flowering. Strong wind or heavy rain now can reduce grain set.", "பூக்கும் நேரத்தில் நீர் பற்றாக்குறை வேண்டாம். இப்போது பலத்த காற்று அல்லது அதிக மழை மகசூலைக் குறைக்கலாம்.", "Keep field moist, about 3-5 cm water", ["STRONG_WIND", "HEAVY_RAIN", "HEAT_STRESS", "DISEASE_FAVOURABLE_WEATHER"], "Inspect panicles and leaves within 24 hours after rain or humid spells."),
    Fruiting: S("Keep soil moist during grain filling and watch for lodging after strong winds.", "கதிர் நிரம்பும் காலத்தில் மண் ஈரமாக இருக்கட்டும்; பலத்த காற்றுக்குப் பின் பயிர் சாய்ந்துள்ளதா என பார்க்கவும்.", "Moist soil; drain field about 10 days before harvest", ["STRONG_WIND", "DROUGHT"], "Check for lodged plants after windy days."),
    Harvest: S("Harvest and dry grain in dry weather. Rain during harvest can spoil grain, so plan around the forecast.", "வறண்ட வானிலையில் அறுவடை செய்து தானியத்தை உலர்த்துங்கள். அறுவடையின்போது மழை தானியத்தை பாதிக்கலாம்.", "Drain the field before harvest", ["HEAVY_RAIN", "DISEASE_FAVOURABLE_WEATHER"], "Keep harvested grain covered and dry.")
  },
  Groundnut: {
    Seedling: S("Sow in well-drained soil with enough moisture. Waterlogging at germination gives a poor stand.", "நன்கு வடியும் மண்ணில் போதிய ஈரத்துடன் விதைக்கவும். முளைக்கும்போது நீர் தேங்கினால் பயிர் எண்ணிக்கை குறையும்.", "Light, even moisture", ["WATERLOGGING", "HEAVY_RAIN"], "Check germination and drain any standing water."),
    Vegetative: S("Give light irrigation in dry spells and keep the field well drained.", "வறட்சி காலத்தில் இலகுவான நீர்ப்பாசனம் செய்யுங்கள்; வயலில் நீர் தேங்காமல் பார்த்துக்கொள்ளுங்கள்.", "Moderate; avoid over-watering", ["DROUGHT", "WATERLOGGING"], "Check soil moisture and leaf colour."),
    Flowering: S("Critical stage: avoid water stress and waterlogging. Pegging needs moist, loose soil.", "முக்கிய நிலை: நீர் பற்றாக்குறை மற்றும் நீர் தேக்கத்தை தவிர்க்கவும். ஊசி இறங்க மண் ஈரமாகவும் தளர்வாகவும் இருக்க வேண்டும்.", "Steady moisture", ["DROUGHT", "WATERLOGGING", "HEAT_STRESS"], "Check soil moisture around pegging zone."),
    Fruiting: S("Ensure good drainage. Humid, wet weather may favour fungal problems in pods, so inspect regularly.", "நல்ல வடிகால் அவசியம். ஈரப்பதம் அதிகமான வானிலை பூஞ்சை பாதிப்புக்கு சாதகமாகலாம்; அடிக்கடி பரிசோதிக்கவும்.", "Moderate; reduce near maturity", ["WATERLOGGING", "DISEASE_FAVOURABLE_WEATHER", "DROUGHT"], "Inspect plants and pods for unusual spots."),
    Harvest: S("Harvest when soil is workable and dry, and dry pods well before storage.", "மண் காய்ந்து பதமாக இருக்கும்போது அறுவடை செய்து, சேமிக்கும் முன் காய்களை நன்றாக உலர்த்துங்கள்.", "Stop irrigation before harvest", ["HEAVY_RAIN", "DISEASE_FAVOURABLE_WEATHER"], "Do not store damp pods.")
  },
  Maize: {
    Seedling: S("Keep moisture even and avoid waterlogging on young plants.", "ஈரப்பதம் சீராக இருக்கட்டும்; இளம் செடிகளில் நீர் தேங்காமல் பார்க்கவும்.", "Light, even moisture", ["WATERLOGGING", "HEAVY_RAIN"], "Check stand and drain standing water."),
    Vegetative: S("Maintain steady moisture. Apply top-dress fertilizer only in a dry spell.", "சீரான ஈரப்பதம் வைத்திருங்கள். மேலுரத்தை வறண்ட நாட்களில் மட்டும் இடுங்கள்.", "Regular irrigation in dry spells", ["WATERLOGGING", "DROUGHT", "HEAVY_RAIN"], "Look for leaf yellowing or wilting."),
    Flowering: S("Most sensitive stage to water stress and heat. Irrigate during dry spells.", "நீர் பற்றாக்குறை மற்றும் வெப்பத்துக்கு மிகவும் உணர்திறன் உள்ள நிலை. வறட்சியில் நீர் பாய்ச்சவும்.", "Do not let the crop dry out", ["DROUGHT", "HEAT_STRESS", "STRONG_WIND"], "Check tassels and silks and soil moisture."),
    Fruiting: S("Watch for lodging in strong wind and keep moisture steady during cob filling.", "பலத்த காற்றில் பயிர் சாய்வதைக் கவனியுங்கள்; கதிர் நிரம்பும்போது ஈரப்பதம் சீராக இருக்கட்டும்.", "Steady moisture", ["STRONG_WIND", "DROUGHT"], "Check for lodged plants after wind."),
    Harvest: S("Harvest and dry cobs in dry weather. High humidity favours mould in stored grain.", "வறண்ட வானிலையில் அறுவடை செய்து கதிர்களை உலர்த்துங்கள். அதிக ஈரப்பதம் பூஞ்சைக்கு சாதகம்.", "Stop irrigation before harvest", ["HEAVY_RAIN", "DISEASE_FAVOURABLE_WEATHER"], "Dry cobs fully before storage.")
  },
  Tomato: {
    Seedling: S("Protect seedlings from heavy rain and strong sun. Water lightly.", "நாற்றுகளை அதிக மழை மற்றும் கடும் வெயிலிலிருந்து பாதுகாக்கவும். இலகுவாக நீர் விடவும்.", "Light, frequent watering", ["HEAVY_RAIN", "HEAT_STRESS"], "Check seedlings for damping off or wilting."),
    Vegetative: S("Avoid waterlogging. Stake plants and keep leaves as dry as possible in humid weather.", "நீர் தேங்காமல் பார்க்கவும். செடிகளுக்கு கம்பு கட்டி, ஈரப்பதமான வானிலையில் இலைகளை உலர்வாக வைக்கவும்.", "Moderate, regular", ["WATERLOGGING", "DISEASE_FAVOURABLE_WEATHER"], "Inspect lower leaves for spots."),
    Flowering: S("Heat and heavy rain can cause flower drop. Keep watering regular and avoid spraying in wind or rain.", "வெப்பம் மற்றும் அதிக மழை பூ உதிர்வை ஏற்படுத்தலாம். சீரான நீர்ப்பாசனம் செய்து, காற்று அல்லது மழையில் தெளிக்க வேண்டாம்.", "Regular, even watering", ["HEAT_STRESS", "HEAVY_RAIN", "DISEASE_FAVOURABLE_WEATHER"], "Check for flower drop."),
    Fruiting: S("Irregular watering or heavy rain can crack fruit. Keep soil moisture even and inspect for fungal problems in humid weather.", "சீரற்ற நீர்ப்பாசனம் அல்லது அதிக மழை பழங்களை வெடிக்கச் செய்யலாம். மண் ஈரப்பதம் சீராக இருக்கட்டும்.", "Even moisture", ["HEAVY_RAIN", "DISEASE_FAVOURABLE_WEATHER", "WATERLOGGING"], "Inspect fruits and leaves within 24 hours after rain."),
    Harvest: S("Harvest ripe fruit before heavy rain and keep it shaded and dry.", "அதிக மழை வரும் முன் பழுத்த பழங்களைப் பறித்து நிழலில் உலர்வாக வைக்கவும்.", "Reduce watering near harvest", ["HEAVY_RAIN", "HEAT_STRESS"], "Sort damaged fruit quickly.")
  },
  Banana: {
    Seedling: S("Keep young plants moist and sheltered from strong wind.", "இளம் செடிகளை ஈரமாகவும் பலத்த காற்றிலிருந்து பாதுகாப்பாகவும் வைக்கவும்.", "Regular light watering", ["DROUGHT", "STRONG_WIND"], "Check for wilting."),
    Vegetative: S("Needs steady water and wind protection. Avoid waterlogging around the base.", "சீரான நீர் மற்றும் காற்று பாதுகாப்பு தேவை. அடிப்பகுதியில் நீர் தேங்கக் கூடாது.", "Regular irrigation", ["STRONG_WIND", "WATERLOGGING", "DROUGHT"], "Check plant base and leaves."),
    Flowering: S("Support plants before strong wind. Keep moisture steady during shooting.", "பலத்த காற்று வரும் முன் செடிகளுக்கு முட்டு கொடுங்கள். குலை வரும்போது ஈரப்பதம் சீராக இருக்கட்டும்.", "Steady moisture", ["STRONG_WIND", "HEAT_STRESS"], "Check props and leaning plants."),
    Fruiting: S("Prop plants with bunches and protect from wind. Keep irrigation steady.", "குலை உள்ள மரங்களுக்கு முட்டு கொடுத்து காற்றிலிருந்து பாதுகாக்கவும். நீர்ப்பாசனம் சீராக இருக்கட்டும்.", "Steady irrigation", ["STRONG_WIND", "DROUGHT"], "Check props before forecast wind."),
    Harvest: S("Harvest bunches in dry weather and avoid transport in heavy rain.", "வறண்ட வானிலையில் குலைகளை அறுவடை செய்யுங்கள்; அதிக மழையில் கொண்டு செல்ல வேண்டாம்.", "Reduce irrigation before harvest", ["HEAVY_RAIN", "STRONG_WIND"], "Handle bunches carefully.")
  },
  Sugarcane: {
    Seedling: S("Keep the soil moist for germination but avoid standing water.", "முளைப்புக்கு மண் ஈரமாக இருக்கட்டும்; ஆனால் நீர் தேங்க வேண்டாம்.", "Light, frequent irrigation", ["DROUGHT", "WATERLOGGING"], "Check sett germination."),
    Vegetative: S("Tillering and grand growth need good moisture. Irrigate in dry spells and drain excess water.", "தூர் கட்டுதல் மற்றும் வளர்ச்சிக்கு நல்ல ஈரப்பதம் தேவை. வறட்சியில் நீர் பாய்ச்சவும், அதிக நீரை வடிக்கவும்.", "Regular irrigation", ["DROUGHT", "WATERLOGGING", "STRONG_WIND"], "Check leaf rolling and soil moisture."),
    Flowering: S("Maturation phase. Reduce irrigation gradually and watch for lodging in strong wind.", "முதிர்ச்சி நிலை. நீர்ப்பாசனத்தை படிப்படியாகக் குறைத்து, பலத்த காற்றில் சாய்வதை கவனிக்கவும்.", "Reduce gradually", ["STRONG_WIND", "DROUGHT"], "Check for lodging."),
    Fruiting: S("Ripening phase. Limit irrigation to build sugar and protect cane from lodging.", "பழுக்கும் நிலை. சர்க்கரை சேர நீர்ப்பாசனத்தை குறைத்து, கரும்பு சாயாமல் பாதுகாக்கவும்.", "Limited irrigation", ["STRONG_WIND", "HEAVY_RAIN"], "Check fields for lodged cane."),
    Harvest: S("Plan harvest and transport for dry days; heavy rain makes fields hard to access.", "வறண்ட நாட்களில் அறுவடை மற்றும் போக்குவரத்தை திட்டமிடுங்கள்; அதிக மழையில் வயலுக்குள் செல்வது கடினம்.", "Stop irrigation before harvest", ["HEAVY_RAIN"], "Deliver cane to the mill promptly.")
  }
};

function getStageGuide(crop, stage) {
  return (STAGE_GUIDE[crop] && STAGE_GUIDE[crop][stage]) || null;
}

module.exports = { STAGE_GUIDE, getStageGuide };
