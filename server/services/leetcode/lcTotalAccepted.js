const { getLCStats } = require("./lcService");

function normalize(submission) {
  const timestamp = Number(submission.timestamp);
  return {
    id: submission.id || submission.titleSlug,
    date: new Date(timestamp * 1000).toISOString().slice(0, 10),
    time: new Date(timestamp * 1000).toISOString(),
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
  const cutoff = Date.now() - days * 86400000;
  const stats = await getLCStats(handle);
  return (stats.recentSubmissions || [])
    .filter((submission) => submission.statusDisplay === "Accepted" &&
      Number(submission.timestamp) * 1000 >= cutoff)
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
