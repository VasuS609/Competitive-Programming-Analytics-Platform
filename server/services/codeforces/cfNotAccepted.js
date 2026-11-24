const { fetchSubmissions } = require("./cfTotalAccepted");
const {safeDate, safeDay} = require("../../utils/dates");

const IGNORED_VERDICTS = new Set(["COMPILATION_ERROR", "SKIPPED", "TESTING", "CHALLENGED"]);

function toDate(seconds) {
  return safeDay(seconds);
}

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
  const cutoff = Date.now() - days * 86400000;

  return (await fetchSubmissions(handle))
    .filter((submission) =>
      submission.problem &&
      submission.verdict &&
      !IGNORED_VERDICTS.has(submission.verdict) &&
      submission.verdict !== "OK" &&
      Number(submission.creationTimeSeconds) * 1000 >= cutoff)
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
