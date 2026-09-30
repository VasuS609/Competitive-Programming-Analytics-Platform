const { getLCStats } = require("./lcService");
const { LeetCode } = require("leetcode-query");
const { buildCalendar, getLastNDates, toUTCDateString } = require("../../utils/dates");
const cache = {};
const CACHE_TTL = 10 * 60 * 1000;
const leetcode = new LeetCode();

const RECENT_AC_QUERY = `query recentAcSubmissions($username: String!, $limit: Int!) {
  recentAcSubmissionList(username: $username, limit: $limit) {
    titleSlug
    timestamp
  }
}`;

async function getLeetcodeSubmissionCalendar(handle, days = 7) {
  const key = String(handle).trim().toLowerCase();
  const cached = cache[key];
  if (cached && Date.now() < cached.expiresAt) {
    return buildCalendar(cached.counts, cached.firstActivityDate, days);
  }

  const profile = await getLCStats(handle);

  const dates = getLastNDates(30);
  const counts = Object.fromEntries(dates.map((date) => [date, 0]));
  const acceptedProblemsByDate = Object.fromEntries(dates.map((date) => [date, new Set()]));
  let firstActivityDate = null;

  let acceptedSubmissions = profile.recentSubmissionList || [];
  try {
    const response = await leetcode.graphql({
      query: RECENT_AC_QUERY,
      variables: { username: handle, limit: 50 },
    });
    acceptedSubmissions = response?.data?.recentAcSubmissionList || acceptedSubmissions;
  } catch {
    acceptedSubmissions = acceptedSubmissions.filter((submission) => submission.statusDisplay === "Accepted");
  }

  acceptedSubmissions
    .filter((submission) => submission.titleSlug && submission.timestamp)
    .forEach((submission) => {
      const date = toUTCDateString(Number(submission.timestamp) * 1000);
      if (date in acceptedProblemsByDate) {
        acceptedProblemsByDate[date].add(submission.titleSlug);
        counts[date] = acceptedProblemsByDate[date].size;
        if (!firstActivityDate || date < firstActivityDate) firstActivityDate = date;
      }
    });

  cache[key] = { counts, firstActivityDate, expiresAt: Date.now() + CACHE_TTL };
  return buildCalendar(counts, firstActivityDate, days);
}

module.exports = { getLeetcodeSubmissionCalendar };