const { JSDOM } = require("jsdom");
const { buildCalendar, getLastNDates, toUTCDateString } = require("../../utils/dates");

const cache = {};
const CACHE_TTL = 10 * 60 * 1000;

async function getCodechefSubmissionCalendar(handle, days = 7) {
  const cached = cache[handle];
  if (cached && Date.now() < cached.expiresAt) {
    return buildCalendar(cached.counts, cached.firstActivityDate, days);
  }

  const response = await fetch(`https://www.codechef.com/users/${encodeURIComponent(handle)}`);
  if (!response.ok) throw new Error(`CodeChef API Error ${response.status}`);

  const html = await response.text();
  const startMarker = "var userDailySubmissionsStats =";
  const start = html.indexOf(startMarker);
  const end = html.indexOf("'#js-heatmap");
  if (start < 0 || end < 0) throw new Error("CodeChef submission calendar was not found");

  const script = html.slice(start + startMarker.length, end);
  const heatMap = JSON.parse(script.slice(0, script.indexOf(";")).trim());
  const dates = getLastNDates(30);
  const counts = Object.fromEntries(dates.map((date) => [date, 0]));
  let firstActivityDate = null;

  const entries = Array.isArray(heatMap)
    ? heatMap.map(({ date, value }) => [date, value])
    : Object.entries(heatMap);
  entries.forEach(([date, count]) => {
    const normalizedDate = toUTCDateString(date);
    if (Number(count) > 0 && (!firstActivityDate || normalizedDate < firstActivityDate)) {
      firstActivityDate = normalizedDate;
    }
    if (normalizedDate in counts) counts[normalizedDate] = Number(count) || 0;
  });

  cache[handle] = { counts, firstActivityDate, expiresAt: Date.now() + CACHE_TTL };
  return buildCalendar(counts, firstActivityDate, days);
}

module.exports = { getCodechefSubmissionCalendar };

//used ai to generate this file