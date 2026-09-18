const { JSDOM } = require("jsdom");

const cache = {};
const CACHE_TTL = 10 * 60 * 1000;

function getLastSevenDates() {
  const dates = [];
  const today = new Date();
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    dates.push(date.toISOString().slice(0, 10));
  }
  return dates;
}

async function getCodechefSubmissionCalendar(handle) {
  const cached = cache[handle];
  if (cached && Date.now() < cached.expiresAt) return cached.data;

  const response = await fetch(`https://www.codechef.com/users/${encodeURIComponent(handle)}`);
  if (!response.ok) throw new Error(`CodeChef API Error ${response.status}`);

  const html = await response.text();
  const startMarker = "var userDailySubmissionsStats =";
  const start = html.indexOf(startMarker);
  const end = html.indexOf("'#js-heatmap");
  if (start < 0 || end < 0) throw new Error("CodeChef submission calendar was not found");

  const script = html.slice(start + startMarker.length, end);
  const heatMap = JSON.parse(script.slice(script.indexOf("{")).split(";")[0].trim());
  const dates = getLastSevenDates();
  const counts = Object.fromEntries(dates.map((date) => [date, 0]));

  Object.entries(heatMap).forEach(([date, count]) => {
    const normalizedDate = new Date(date).toISOString().slice(0, 10);
    if (normalizedDate in counts) counts[normalizedDate] = Number(count) || 0;
  });

  const data = dates.map((date) => ({ date, count: counts[date] }));
  cache[handle] = { data, expiresAt: Date.now() + CACHE_TTL };
  return data;
}

module.exports = { getCodechefSubmissionCalendar };