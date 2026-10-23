const { getSolvedProblems, syncSolvedProblems } = require("../solvedProblemService");

const CACHE_TTL = 10 * 60 * 1000;
const DEFAULT_TZ_OFFSET_MIN = 330; // IST. 


const rawCache = {};  
const statsCache = {}; 
const { getCFAcceptedActivity } = require("./cfTotalAccepted");


async function fetchJson(url) {
    const response = await fetch(url);

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Codeforces API Error ${response.status}: ${text.slice(0, 200)}`);
    }

    const json = await response.json();
    if (json.status !== "OK") {
        throw new Error(`Codeforces API Error: ${json.comment || "unknown error"}`);
    }
    return json;
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

function toDate(ms, offset = DEFAULT_TZ_OFFSET_MIN) {
    return new Date(ms + offset * 60000).toISOString().slice(0, 10);
}

function buildSolveActivity(firstSolves, offset = DEFAULT_TZ_OFFSET_MIN) {
    const daily = {};
    for (const submission of firstSolves.values()) {
        const date = toDate(submission.creationTimeSeconds * 1000, offset);
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

async function getRawData(handle) {
    const cached = rawCache[handle];
    if (cached && Date.now() < cached.expiresAt) return cached.data;

    const h = encodeURIComponent(handle);

    const [status, info] = await Promise.all([
        fetchJson(`https://codeforces.com/api/user.status?handle=${h}`),
        fetchJson(`https://codeforces.com/api/user.info?handles=${h}`),
    ]);

    const data = { submissions: status.result, profile: info.result[0] };
    rawCache[handle] = { data, expiresAt: Date.now() + CACHE_TTL };
    return data;
}


async function fetchFromCF(handle, { tzOffsetMin = DEFAULT_TZ_OFFSET_MIN } = {}) {
    const { submissions, profile } = await getRawData(handle);
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
        solveActivity: buildSolveActivity(firstSolves, tzOffsetMin),
        weakTopics: analyzeWeakTopics(submissions),
    };
}

async function getCFStats(handle) {
    const cached = statsCache[handle];

    if (cached && Date.now() < cached.expiresAt) {
        console.log("codeforces cache hit for", handle);
        return cached.data;
    }

    console.log("cache miss... fetching fresh data for", handle);
    const data = await fetchFromCF(handle);
    statsCache[handle] = { data, expiresAt: Date.now() + CACHE_TTL };
    return data;
}


async function run(handle) {
    return getCFStats(handle);
}

module.exports = run;
module.exports.getCFStats = getCFStats;
module.exports.getCFAcceptedActivity = getCFAcceptedActivity;