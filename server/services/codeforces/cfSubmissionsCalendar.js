const cache = {};
const { buildCalendar, getLastNDates, toUTCDateString } = require("../../utils/dates");

const CACHE_TTL = 10 * 60 * 1000;

async function fetchJson(url) {

  const response = await fetch(url);

  if (!response.ok) throw new Error(`Codeforces API Error ${response.status}`);

  return response.json();
}

async function getCodeforcesSubmissionCalendar(handle, days = 7) {
  const cached = cache[handle];

  if (cached && Date.now() < cached.expiresAt) {
    return buildCalendar(cached.counts, cached.firstActivityDate, days);
  }

  const dates = getLastNDates(30);
  const counts = Object.fromEntries(dates.map((date) => [date, 0]));
  let firstActivityDate = null;

  const response = await fetchJson(`https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}`);

  response.result.forEach((submission) => {
    const date = toUTCDateString(submission.creationTimeSeconds * 1000);
    if (!firstActivityDate || date < firstActivityDate) firstActivityDate = date;

    if (date in counts) counts[date] += 1;
  });

  cache[handle] = { counts, firstActivityDate, expiresAt: Date.now() + CACHE_TTL };

  return buildCalendar(counts, firstActivityDate, days);
}

module.exports = { getCodeforcesSubmissionCalendar };