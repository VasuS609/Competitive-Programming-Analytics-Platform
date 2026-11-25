const { createTtlCache } = require("../../utils/ttlCache");
const { getSolvedProblems, syncSolvedProblems } = require("../solvedProblemService");
const { fetchJson } = require("../../utils/httpClient");
const { safeDay } = require("../../utils/dates");
const { fetchSubmissions, getCFAcceptedActivity } = require("./cfTotalAccepted");
const { handleKey, classifyVerdict } = require("../../utils/helpers");

const statsCache = createTtlCache();

function validateCFResponse(body) {
  if (body.status !== "OK") {
    const e = new Error(body.comment || "Codeforces API error");
    e.status = 502;
    throw e;
  }
}

async function fetchCFJson(url) {
  return fetchJson(url, { validate: validateCFResponse });
}

const problemKey = (p) => `${p.contestId}-${p.index}`;

const problemUrl = (p) =>
  p.contestId >= 100000
    ? `https://codeforces.com/gym/${p.contestId}/problem/${p.index}`
    : `https://codeforces.com/contest/${p.contestId}/problem/${p.index}`;

function getFirstSolves(submissions) {
  const first = new Map();
  for (const submission of submissions) {
    if (submission.verdict !== "OK" || !submission.problem) continue;
    const key = problemKey(submission.problem);
    if (!first.has(key) || submission.creationTimeSeconds < first.get(key).creationTimeSeconds) {
      first.set(key, submission);
    }
  }
  return first;
}

// All dates are stored and returned as UTC (YYYY-MM-DD).
function buildSolveActivity(firstSolves) {
  const daily = {};
  for (const submission of firstSolves.values()) {
    const date = safeDay(submission.creationTimeSeconds);
    if (!date) continue;
    daily[date] = (daily[date] || 0) + 1;
  }
  return {
    daily: Object.entries(daily).map(([date, solved]) => ({ date, solved })),
    summary: { total: firstSolves.size },
  };
}

function analyzeWeakTopics(submissions) {
  const stats = {};
  for (const submission of submissions) {
    if (!submission.problem || classifyVerdict(submission.verdict) !== "notAccepted") continue;
    for (const tag of submission.problem.tags || []) {
      const row = stats[tag] || (stats[tag] = { tag, failed: 0 });
      row.failed += 1;
    }
  }
  return { weakTopics: Object.values(stats).sort((a, b) => b.failed - a.failed) };
}

async function getRawData(handle, { forceRefresh = false } = {}) {
  const h = encodeURIComponent(handle);

  const [submissions, info] = await Promise.all([
    fetchSubmissions(handle, { forceRefresh }),
    fetchCFJson(`https://codeforces.com/api/user.info?handles=${h}`),
  ]);

  return { submissions, profile: info.result[0] };
}

async function fetchFromCF(handle, opts = {}) {
  const { submissions, profile } = await getRawData(handle, opts);
  const firstSolves = getFirstSolves(submissions);

  const fetchedProblems = [...firstSolves.values()].map((s) => ({
    name: s.problem.name,
    rating: s.problem.rating,
    id: `${s.problem.contestId}-${s.problem.index}`,
    index: s.problem.index,
    tags: s.problem.tags,
    url: problemUrl(s.problem),
  }));

  await syncSolvedProblems("codeforces", handle, fetchedProblems);

  return {
    username: profile.handle,
    rank: profile.rank || "Unrated",
    rating: profile.rating || 0,
    problemSolved: firstSolves.size,
    problems: await getSolvedProblems("codeforces", handle),
    solveActivity: buildSolveActivity(firstSolves),
    weakTopics: analyzeWeakTopics(submissions),
  };
}

function getCFStats(handle, options) {
  return statsCache.get(handleKey(handle), () => fetchFromCF(handle, options), options);
}

async function run(handle) {
  return getCFStats(handle);
}

module.exports = run;
module.exports.getCFStats = getCFStats;
module.exports.getCFAcceptedActivity = getCFAcceptedActivity;
