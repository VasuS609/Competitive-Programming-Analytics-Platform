const { getLCStats } = require("./lcService");
const { getLastNDates, safeDate, safeDay } = require("../../utils/dates");

function normalize(submission) {
  return {
    id: submission.id || submission.titleSlug,
    
    date: safeDay(submission.timestamp),
    time: safeDate(submission.timestamp),
    
    contestId: null,
    index: null,
    questionName: submission.title || submission.titleSlug || "Unknown problem",
    rating: null,
    tags: [],
    verdict: "Accepted",
    programmingLanguage: null,
    problemUrl: submission.titleSlug ? `https://leetcode.com/problems/${submission.titleSlug}/` : null,
  };
}

async function getLCAcceptedSubmissions(handle, days = 7) {
  const dates = new Set(getLastNDates(days));
  const stats = await getLCStats(handle);

  return (stats.recentSubmissions || [])
    .filter((submission) => submission.statusDisplay === "Accepted" &&
      dates.has(safeDay(submission.timestamp)))
    .map(normalize);
}

async function getLCAcceptedActivity(handle, days = 7) {
  const rows = await getLCAcceptedSubmissions(handle, days);
  const daily = {};
  for (const row of rows) {
    const entry = daily[row.date] || { submissions: 0, accepted: 0, nonAccepted: 0 };
    entry.submissions += 1;
    entry.accepted += 1;
    daily[row.date] = entry;
  }
  return Object.entries(daily).map(([date, row]) => ({ date, ...row }));
}

module.exports = { getLCAcceptedSubmissions, getLCAcceptedActivity };
