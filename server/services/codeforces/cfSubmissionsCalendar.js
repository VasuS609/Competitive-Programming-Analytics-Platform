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
  const acceptedProblemsByDate = Object.fromEntries(dates.map((date) => [date, new Set()]));
  let firstActivityDate = null;

  const response = await fetchJson(`https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}`);

  response.result.forEach((submission) => {
    if (submission.verdict !== "OK" || !submission.problem) return;

    const date = toUTCDateString(submission.creationTimeSeconds * 1000);
    const problem = `${submission.problem.contestId || submission.problem.problemsetName || "problem"}:${submission.problem.index || submission.problem.name}`;

    if (date in acceptedProblemsByDate) {
      acceptedProblemsByDate[date].add(problem);
      counts[date] = acceptedProblemsByDate[date].size;
      if (!firstActivityDate || date < firstActivityDate) firstActivityDate = date;
    }
  });

  cache[handle] = { counts, firstActivityDate, expiresAt: Date.now() + CACHE_TTL };

  return buildCalendar(counts, firstActivityDate, days);
}

module.exports = { getCodeforcesSubmissionCalendar };