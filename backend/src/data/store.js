const crypto = require("crypto");

/**
 * AgriCast AI runs entirely on an in-memory data store - no MongoDB or any
 * other database is required. This keeps the hackathon demo "just works"
 * with a single `npm install && npm run dev`.
 *
 * Trade-off (documented, not hidden): data resets whenever the backend
 * process restarts. For a persistent version, swap this file for a real
 * MongoDB/Mongoose layer - every controller only calls the methods below
 * (find, findOne, findById, create, insertMany, updateById, count, deleteAll),
 * so the rest of the codebase would not need to change.
 */

function generateId() {
  return crypto.randomUUID();
}

class Collection {
  constructor(name) {
    this.name = name;
    this.items = [];
  }

  _stamp(doc) {
    const now = new Date().toISOString();
    return { _id: doc._id || generateId(), createdAt: now, updatedAt: now, ...doc };
  }

  insertMany(docs) {
    const created = docs.map((d) => this._stamp(d));
    this.items.push(...created);
    return created;
  }

  create(doc) {
    const created = this._stamp(doc);
    this.items.push(created);
    return created;
  }

  find(filterFn = () => true) {
    return this.items.filter(filterFn);
  }

  findOne(filterFn) {
    return this.items.find(filterFn) || null;
  }

  findById(id) {
    if (!id) return null;
    return this.items.find((i) => i._id === String(id)) || null;
  }

  updateById(id, updates) {
    const idx = this.items.findIndex((i) => i._id === String(id));
    if (idx === -1) return null;
    this.items[idx] = { ...this.items[idx], ...updates, updatedAt: new Date().toISOString() };
    return this.items[idx];
  }

  count(filterFn = () => true) {
    return this.items.filter(filterFn).length;
  }

  deleteAll() {
    this.items = [];
  }
}

const collections = {
  users: new Collection("users"),
  panchayats: new Collection("panchayats"),
  weatherObservations: new Collection("weatherObservations"),
  weatherForecasts: new Collection("weatherForecasts"),
  regionalForecasts: new Collection("regionalForecasts"),
  cropProfiles: new Collection("cropProfiles"),
  advisories: new Collection("advisories"),
  alerts: new Collection("alerts"),
  forecastVerifications: new Collection("forecastVerifications"),
  modelMetrics: new Collection("modelMetrics"),
  voiceSessions: new Collection("voiceSessions"),
  farmerPhotoRiskChecks: new Collection("farmerPhotoRiskChecks"),
  riskSavedCalculations: new Collection("riskSavedCalculations"),
  auditLogs: new Collection("auditLogs"),
  reports: new Collection("reports"),
};

// Attaches referenced documents by id - a tiny stand-in for Mongoose's .populate().
function attach(doc, field, collection, project) {
  if (!doc) return doc;
  const ref = collection.findById(doc[field]);
  const attached = ref && project ? project(ref) : ref;
  return { ...doc, [field]: attached };
}

let seeded = false;
function seedIfNeeded() {
  if (seeded) return;
  seeded = true;
  require("./seed")(collections);
  // eslint-disable-next-line no-console
  console.log(
    `AgriCast AI in-memory demo data ready (${collections.panchayats.items.length} Panchayats, ` +
      `${collections.cropProfiles.items.length} crops, ${collections.users.items.length} demo users).`
  );
}

module.exports = { collections, generateId, attach, seedIfNeeded };
