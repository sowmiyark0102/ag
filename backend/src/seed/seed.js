/**
 * AgriCast AI seeds its in-memory demo data automatically the moment the
 * server (or any request) needs it - see src/data/store.js. There is no
 * separate database to populate, so this script is just a convenience
 * confirmation for anyone used to running `npm run seed` first.
 */
const { seedIfNeeded, collections } = require("../data/store");

seedIfNeeded();

console.log("AgriCast AI demo data is in-memory and seeds automatically on server start.");
console.log(`Panchayats: ${collections.panchayats.items.length}`);
console.log(`Crops: ${collections.cropProfiles.items.length}`);
console.log(`Demo users: ${collections.users.items.length}`);
console.log("");
console.log("Demo Farmer login:  9999900001 / Demo@12345");
console.log("Demo Officer login: 9999900002 / Demo@12345");
console.log("");
console.log("Just run `npm run dev` next - no separate seed step is required.");
