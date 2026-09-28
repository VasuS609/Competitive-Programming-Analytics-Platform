const { getLCStats } = require("./lcService");
const { buildCalendar, getLastNDates, toUTCDateString } = require("../../utils/dates");
const cache = {};
const CACHE_TTL = 10 * 60 * 1000;

async function getLeetcodeSubmissionCalendar(handle, days = 7) {
  const key = String(handle).trim().toLowerCase();
  const cached = cache[key];
  if (cached && Date.now() < cached.expiresAt) {
    return buildCalendar(cached.counts, cached.firstActivityDate, days);
  }

  const profile = await getLCStats(handle);

  let calendar = {};
  try {
    calendar = JSON.parse(profile.submissionCalendar || "{}");
  } catch {
    calendar = {};
  }

  const dates = getLastNDates(30);
  const counts = Object.fromEntries(dates.map((date) => [date, 0]));
  let firstActivityDate = null;

  Object.entries(calendar).forEach(([timestamp, count]) => {
    const date = toUTCDateString(Number(timestamp) * 1000);
    if (Number(count) > 0 && (!firstActivityDate || date < firstActivityDate)) {
      firstActivityDate = date;
    }
    if (date in counts) counts[date] += Number(count) || 0;
  });

  cache[key] = { counts, firstActivityDate, expiresAt: Date.now() + CACHE_TTL };
  return buildCalendar(counts, firstActivityDate, days);
}

module.exports = { getLeetcodeSubmissionCalendar };