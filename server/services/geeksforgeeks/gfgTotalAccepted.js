const { getGfgStats } = require("./gfgService");
async function getGfgAcceptedActivity(handle) {
  const stats = await getGfgStats(handle);
  return (stats.heatmap || stats.dailyContributions || []).map((entry) => ({
    date: entry.date || entry.day || null,
    submissions: Number(entry.count ?? entry.value ?? entry.contributions) || 0,
    accepted: null,
    nonAccepted: null,
    records: [],
  }));
}
module.exports = { getGfgAcceptedActivity };
