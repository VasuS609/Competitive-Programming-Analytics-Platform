const { buildCalendar, getLastNDates, toUTCDateString } = require("../../utils/dates");

const cache = {};
const CACHE_TTL = 10 * 60 * 1000;

async function getCodeforcesSubmissionCalendar(handle, days = 7) {
  const key = String(handle).trim().toLowerCase();
  const cached = cache[key];

  if (cached && Date.now() < cached.expiresAt) {
    return buildCalendar(cached.counts, cached.firstActivityDate, days);
  }

  const response = await fetch(
    `https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}`,
  );
  const body = await response.json().catch(() => ({}));

  if (!response.ok || body.status !== "OK") {
    const error = new Error(body.comment || `Codeforces API Error ${response.status}`);
    error.status = response.status;
    throw error;
  }

  const dates = getLastNDates(30);
  const counts = Object.fromEntries(dates.map((date) => [date, 0]));
  let firstActivityDate = null;

  for (const submission of body.result || []) {
    if (!submission.creationTimeSeconds) continue;
    const date = toUTCDateString(submission.creationTimeSeconds * 1000);
    if (!(date in counts)) continue;
    counts[date] += 1;
    if (!firstActivityDate || date < firstActivityDate) firstActivityDate = date;
  }

  cache[key] = { counts, firstActivityDate, expiresAt: Date.now() + CACHE_TTL };
  return buildCalendar(counts, firstActivityDate, days);
}

module.exports = { getCodeforcesSubmissionCalendar };
