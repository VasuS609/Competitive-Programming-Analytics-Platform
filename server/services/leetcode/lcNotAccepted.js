const { getLCStats } = require("./lcService");
const {safeDate, safeDay} = require("../../utils/dates");

function normalize(submission) {
  const timestamp = Number(submission.timestamp);
  return {
    id: submission.id || submission.titleSlug,
    date: safeDay(contest.ratingUpdateTimeSeconds),
    time: safeDate(contest.ratingUpdateTimeSeconds),
    contestId: null,
    index: null,
    questionName: submission.title || submission.titleSlug || "Unknown problem",
    rating: null,
    tags: [],
    verdict: submission.statusDisplay || "Not accepted",
    programmingLanguage: null,
    problemUrl: submission.titleSlug ? `https://leetcode.com/problems/${submission.titleSlug}/` : null,
  };
}

async function getLCNotAcceptedSubmissions(handle, days = 7) {
  const cutoff = Date.now() - days * 86400000;
  const stats = await getLCStats(handle);
  return (stats.recentSubmissions || [])
    .filter((submission) => submission.statusDisplay !== "Accepted" &&
      Number(submission.timestamp) * 1000 >= cutoff)
    .map(normalize);
}

async function getLCNotAcceptedActivity(handle, days = 7) {
  const rows = await getLCNotAcceptedSubmissions(handle, days);
  const daily = {};
  for (const row of rows) {
    const entry = daily[row.date] || { submissions: 0, accepted: 0, nonAccepted: 0 };
    entry.submissions += 1;
    entry.nonAccepted += 1;
    daily[row.date] = entry;
  }
  return Object.entries(daily).map(([date, row]) => ({ date, ...row }));
}

module.exports = { getLCNotAcceptedSubmissions, getLCNotAcceptedActivity };
