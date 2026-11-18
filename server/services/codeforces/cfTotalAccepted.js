const { fetchJson } = require("../../utils/httpClient");
const { toUTCDateString } = require("../../utils/dates");

const CACHE_TTL = 10 * 60 * 1000;
const cache = {};

async function fetchSubmissions(handle, { forceRefresh = false } = {}) {
  const key = String(handle).trim().toLowerCase();
  if (!forceRefresh && cache[key] && Date.now() < cache[key].expiresAt) {
    return cache[key].data;
  }

  const body = await fetchJson(
    `https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}`,
    {
      validate(b) {
        if (b.status !== "OK") {
          const e = new Error(b.comment || "Codeforces API error");
          e.status = 502;
          throw e;
        }
      },
    },
  );

  cache[key] = { data: body.result || [], expiresAt: Date.now() + CACHE_TTL };
  return cache[key].data;
}

function toSubmission(submission) {
  const problem = submission.problem || {};
  return {
    id: submission.id,
    date: toUTCDateString(Number(submission.creationTimeSeconds) * 1000),
    time: new Date(Number(submission.creationTimeSeconds) * 1000).toISOString(),
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
  const cutoff = Date.now() - days * 86400000;
  return (await fetchSubmissions(handle, opts))
    .filter(
      (submission) =>
        submission.verdict === "OK" &&
        submission.problem &&
        Number(submission.creationTimeSeconds) * 1000 >= cutoff,
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
