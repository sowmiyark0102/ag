// Vercel serverless entry point: exports the Express app.
const app = require("../src/app");
const { seedIfNeeded } = require("../src/data/store");
seedIfNeeded();
module.exports = app;
