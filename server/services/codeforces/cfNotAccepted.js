const { fetchSubmissions } = require("./cfTotalAccepted");
const { getLastNDates, safeDate, safeDay } = require("../../utils/dates");
const { classifyVerdict } = require("../../utils/helpers");

function toSubmission(submission) {
  const problem = submission.problem || {};
  return {
    id: submission.id,

    date: safeDay(submission.creationTimeSeconds),
    time: safeDate(submission.creationTimeSeconds),

    contestId: problem.contestId ?? null,
    index: problem.index ?? null,
    questionName: problem.name || "Unknown problem",
    rating: problem.rating ?? null,
    tags: problem.tags || [],
    verdict: submission.verdict,
    programmingLanguage: submission.programmingLanguage || null,
    problemUrl: problem.contestId
      ? `https://codeforces.com/${problem.contestId >= 100000 ? "gym" : "contest"}/${problem.contestId}/problem/${problem.index}`
      : null,
  };
}

async function getCFNotAcceptedSubmissions(handle, days = 7) {
  const dates = new Set(getLastNDates(days));

  return (await fetchSubmissions(handle))
    .filter((submission) =>
      submission.problem &&
      classifyVerdict(submission.verdict) === "notAccepted" &&
      dates.has(safeDay(submission.creationTimeSeconds)))
    .map(toSubmission);
}

async function getCFNotAcceptedActivity(handle, days = 7) {
  const rows = await getCFNotAcceptedSubmissions(handle, days);
  const byDate = {};

  for (const row of rows) {

    const entry = byDate[row.date] || { submissions: 0, accepted: 0, nonAccepted: 0 };
    entry.submissions += 1;
    entry.nonAccepted += 1;
    byDate[row.date] = entry;
  }
  return Object.entries(byDate).map(([date, entry]) => ({ date, ...entry }));
}

module.exports = { getCFNotAcceptedSubmissions, getCFNotAcceptedActivity };
