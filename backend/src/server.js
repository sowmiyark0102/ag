require("dotenv").config();
const app = require("./app");
const { seedIfNeeded } = require("./data/store");

const PORT = process.env.PORT || 5000;
seedIfNeeded();
app.listen(PORT, () => {
  console.log(`AgriCast AI backend listening on http://localhost:${PORT}`);
  console.log("In-memory data store: no database required. Data resets when the server restarts.");
});
