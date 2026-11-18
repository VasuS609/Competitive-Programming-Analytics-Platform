const { getSolvedProblems, syncSolvedProblems } = require("../solvedProblemService");
const { fetchJson } = require("../../utils/httpClient");
const { toUTCDateString } = require("../../utils/dates");
const { getCFAcceptedActivity } = require("./cfTotalAccepted");

const CACHE_TTL = 10 * 60 * 1000;

const rawCache = {};
const statsCache = {};

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
    const date = toUTCDateString(submission.creationTimeSeconds * 1000);
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
    if (!submission.problem || submission.verdict === "OK") continue;
    for (const tag of submission.problem.tags || []) {
      const row = stats[tag] || (stats[tag] = { tag, failed: 0 });
      row.failed += 1;
    }
  }
  return { weakTopics: Object.values(stats).sort((a, b) => b.failed - a.failed) };
}

async function getRawData(handle, { forceRefresh = false } = {}) {
  const cached = rawCache[handle];
  if (!forceRefresh && cached && Date.now() < cached.expiresAt) return cached.data;

  const h = encodeURIComponent(handle);
  const [status, info] = await Promise.all([
    fetchCFJson(`https://codeforces.com/api/user.status?handle=${h}`),
    fetchCFJson(`https://codeforces.com/api/user.info?handles=${h}`),
  ]);

  const data = { submissions: status.result, profile: info.result[0] };
  rawCache[handle] = { data, expiresAt: Date.now() + CACHE_TTL };
  return data;
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

async function getCFStats(handle, { forceRefresh = false } = {}) {
  const cached = statsCache[handle];
  if (!forceRefresh && cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  const data = await fetchFromCF(handle, { forceRefresh });
  statsCache[handle] = { data, expiresAt: Date.now() + CACHE_TTL };
  return data;
}

async function run(handle) {
  return getCFStats(handle);
}

module.exports = run;
module.exports.getCFStats = getCFStats;
module.exports.getCFAcceptedActivity = getCFAcceptedActivity;
