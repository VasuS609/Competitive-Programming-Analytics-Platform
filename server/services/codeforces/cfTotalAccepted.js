const { fetchJson } = require("../../utils/httpClient");
const { getLastNDates, safeDay, safeDate } = require("../../utils/dates");

const { handleKey } = require("../../utils/helpers");
const { createTtlCache } = require("../../utils/ttlCache");
const cache = createTtlCache();

function fetchSubmissions(handle, options) {
  return cache.get(handleKey(handle), async () => {
    const body = await fetchJson(
      `https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}`,
      {
        validate(body) {
          if (body?.status !== "OK" || !Array.isArray(body.result)) {
            throw Object.assign(new Error(body?.comment || "Invalid Codeforces submission response"), { status: 502 });
          }
        },
      },
    );
    return body.result;
  }, options);
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

async function getCFAcceptedSubmissions(handle, days = 7, opts = {}) {
  const dates = new Set(getLastNDates(days));
  return (await fetchSubmissions(handle, opts))
    .filter(
      (submission) =>
        submission.verdict === "OK" &&
        submission.problem &&
        dates.has(safeDay(submission.creationTimeSeconds)),
    )
    .map(toSubmission);
}

async function getCFAcceptedActivity(handle, days = 7, opts = {}) {
  const rows = await getCFAcceptedSubmissions(handle, days, opts);
  const byDate = {};
  for (const row of rows) {
    const entry = byDate[row.date] || { submissions: 0, accepted: 0, nonAccepted: 0 };
    entry.submissions += 1;
    entry.accepted += 1;
    byDate[row.date] = entry;
  }
  return Object.entries(byDate).map(([date, entry]) => ({ date, ...entry }));
}

module.exports = {
  fetchSubmissions,
  getCFAcceptedSubmissions,
  getCFAcceptedActivity,
};
