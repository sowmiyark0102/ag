/** Generates human-readable, unique report IDs like AGR-2026-000124. */
let counter = 0;

function nextReportId(existingCount) {
  counter = Math.max(counter, existingCount || 0) + 1;
  const year = new Date().getFullYear();
  return `AGR-${year}-${String(counter).padStart(6, "0")}`;
}

module.exports = { nextReportId };
