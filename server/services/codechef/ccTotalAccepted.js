const { getCodeChefStats } = require("./codechefService");

async function getCodeChefAcceptedActivity(handle, days = 7) {
  const stats = await getCodeChefStats(handle);
  return (stats.heatMap || [])
    .map((entry) => Array.isArray(entry) ? { date: entry[0], count: entry[1] } : entry)
    .filter((entry) => Number(entry.count ?? entry.value) > 0)
    .slice(-days)
    .map((entry) => ({
      date: entry.date,
      submissions: Number(entry.count ?? entry.value) || 0,
      accepted: null,
      nonAccepted: null,
      records: [],
    }));
}

module.exports = { getCodeChefAcceptedActivity };
