const { toUTCDateString, getLastNDates } = require("../../utils/dates");

const LIKELY_CAP = 20;
const RECENT_AC_QUERY = `query recentAcSubmissions($username: String!, $limit: Int!) {
  recentAcSubmissionList(username: $username, limit: $limit) { titleSlug timestamp }
}`;

function nextDay(date) {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return next.toISOString().slice(0, 10);
}

function buildLeetcodeDaily(calendar, acList, days) {
  const dates = getLastNDates(days);
  const totals = {};
  Object.entries(calendar || {}).forEach(([timestamp, count]) => {
    const date = toUTCDateString(Number(timestamp) * 1000);
    if (date) totals[date] = (totals[date] || 0) + (Number(count) || 0);
  });
  const acceptedByDate = {};
  let oldest = null;
  for (const submission of acList || []) {
    const date = toUTCDateString(Number(submission.timestamp) * 1000);
    if (!date) continue;
    acceptedByDate[date] = (acceptedByDate[date] || 0) + 1;
    if (!oldest || date < oldest) oldest = date;
  }
  const truncated = (acList || []).length >= LIKELY_CAP;
  const coverageStart = truncated && oldest ? nextDay(oldest) : dates[0];
  return dates.flatMap((date) => {
    const total = totals[date] || 0;
    const covered = date >= coverageStart;
    const accepted = covered ? acceptedByDate[date] || 0 : 0;
    const submissions = Math.max(total, accepted);
    return submissions ? [{ date, submissions, accepted, nonAccepted: covered ? submissions - accepted : 0 }] : [];
  });
}

let client = null;
async function getLeetcodeDailyStats(handle, days = 7) {
  const { LeetCode } = require("leetcode-query");
  const { getLCStats } = require("./lcService");
  client = client || new LeetCode();
  const stats = await getLCStats(handle);
  let acList;
  try {
    const response = await client.graphql({ query: RECENT_AC_QUERY, variables: { username: handle, limit: 100 } });
    acList = response?.data?.recentAcSubmissionList || [];
  } catch {
    acList = (stats.recentSubmissionList || []).filter((submission) => submission.statusDisplay === "Accepted");
  }
  const calendar = typeof stats.submissionCalendar === "string" ? JSON.parse(stats.submissionCalendar || "{}") : stats.submissionCalendar || {};
  return buildLeetcodeDaily(calendar, acList, days);
}

module.exports = { buildLeetcodeDaily, getLeetcodeDailyStats };
