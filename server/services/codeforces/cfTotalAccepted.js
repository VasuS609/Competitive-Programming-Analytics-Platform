const CACHE_TTL = 10 * 60 * 1000;
const cache = {};

async function fetchSubmissions(handle) {
  const key = String(handle).trim().toLowerCase();
  if (cache[key] && Date.now() < cache[key].expiresAt) return cache[key].data;

  const response = await fetch(
    `https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}`,
  );
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.status !== "OK") {
    const error = new Error(body.comment || `Codeforces API Error ${response.status}`);
    error.status = response.status;
    throw error;
  }
  cache[key] = { data: body.result || [], expiresAt: Date.now() + CACHE_TTL };
  return cache[key].data;
}

function toDate(seconds) {
  return new Date(Number(seconds) * 1000).toISOString().slice(0, 10);
}

function toSubmission(submission) {
  const problem = submission.problem || {};
  return {
    id: submission.id,
    date: toDate(submission.creationTimeSeconds),
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

async function getCFAcceptedSubmissions(handle, days = 7) {
  const cutoff = Date.now() - days * 86400000;
  return (await fetchSubmissions(handle))
    .filter((submission) =>
      submission.verdict === "OK" &&
      submission.problem &&
      Number(submission.creationTimeSeconds) * 1000 >= cutoff)
    .map(toSubmission);
}

async function getCFAcceptedActivity(handle, days = 7) {
  const rows = await getCFAcceptedSubmissions(handle, days);
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
