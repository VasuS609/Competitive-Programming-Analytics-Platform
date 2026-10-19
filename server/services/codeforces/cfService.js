const { getSolvedProblems, syncSolvedProblems } = require("../solvedProblemService");

const CACHE_TTL = 10 * 60 * 1000;
const DEFAULT_TZ_OFFSET_MIN = 330; // IST. 


const rawCache = {};  
const statsCache = {}; 


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
        const previous = first.get(key);
        if (!previous || submission.creationTimeSeconds < previous.creationTimeSeconds) {
            first.set(key, submission);
        }
    }
    return first;
}


// "YYYY-MM-DD" 
function toDate(ms, tzOffsetMin = DEFAULT_TZ_OFFSET_MIN) {
    return new Date(ms + tzOffsetMin * 60000).toISOString().slice(0, 10);
}


function addDays(dateStr, n) {
    const d = new Date(`${dateStr}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
}


function dateRange(from, to) {
    const out = [];
    for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
    return out;
}

function analyzeWeakTopics(submissions, { window = 150, ignoreEventuallySolved = false } = {}) {
    const solved = new Set(
        submissions.filter((s) => s.verdict === "OK" && s.problem).map((s) => problemKey(s.problem)),
    );
    const recent = submissions
        .filter((s) => s.problem && s.creationTimeSeconds)
        .sort((a, b) => b.creationTimeSeconds - a.creationTimeSeconds)
        .slice(0, window);
    const topics = {};
    const failures = [];
    for (const submission of recent) {
        const accepted = submission.verdict === "OK";
        const eventuallySolved = solved.has(problemKey(submission.problem));
        const failed = !accepted && !(ignoreEventuallySolved && eventuallySolved);
        if (failed) failures.push({
            name: submission.problem.name,
            verdict: submission.verdict,
            tags: submission.problem.tags || [],
            rating: submission.problem.rating,
            eventuallySolved,
            url: problemUrl(submission.problem),
            date: toDate(submission.creationTimeSeconds * 1000),
        });
        for (const tag of submission.problem.tags || []) {
            const stats = topics[tag] || (topics[tag] = { tag, attempts: 0, failed: 0, accepted: 0 });
            stats.attempts += 1;
            if (accepted) stats.accepted += 1;
            else if (failed) stats.failed += 1;
        }
    }
    return {
        windowSize: recent.length,
        failedSubmissions: failures.length,
        weakTopics: Object.values(topics)
            .filter((topic) => topic.failed)
            .map((topic) => ({ ...topic, failRate: Math.round(topic.failed / topic.attempts * 100) }))
            .sort((a, b) => b.failed - a.failed || b.failRate - a.failRate),
        recentFailures: failures,
    };
}

// raw data 

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

/* ------------------------------- main ------------------------------- */

async function fetchFromCF(handle, { tzOffsetMin = DEFAULT_TZ_OFFSET_MIN } = {}) {
    const { submissions, profile } = await getRawData(handle);

    const firstSolves = getFirstSolves(submissions);

    const fetchedProblems = [...firstSolves.values()].map((s) => ({
        name: s.problem.name,
        rating: s.problem.rating,
        id: s.problem.contestId,
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

// Standalone versions (share the same cached fetch, accept custom options)
async function getCFSolveActivity(handle, tzOffsetMin = DEFAULT_TZ_OFFSET_MIN) {
    const { submissions } = await getRawData(handle);
    return buildSolveActivity(getFirstSolves(submissions), tzOffsetMin);
}


async function getCFAcceptedActivity(handle, days = 7) {
    const { submissions } = await getRawData(handle);
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const activityByDate = new Map();

    for (const submission of submissions) {
        if (!submission.problem || !submission.creationTimeSeconds ||
            submission.creationTimeSeconds * 1000 < cutoff) continue;
        const date = toDate(submission.creationTimeSeconds * 1000);
        const entry = activityByDate.get(date) || { submissions: 0, accepted: 0, acceptedProblems: new Set() };
        entry.submissions += 1;
        if (submission.verdict === "OK") {
            entry.accepted += 1;
            entry.acceptedProblems.add(problemKey(submission.problem));
        }
        activityByDate.set(date, entry);
    }

    return [...activityByDate.entries()].map(([date, entry]) => ({
        date,
        submissions: entry.submissions,
        accepted: entry.accepted,
        nonAccepted: entry.submissions - entry.accepted,
        acceptedProblems: entry.acceptedProblems.size,
    }));
}

async function getCFWeakTopics(handle, options) {
    const { submissions } = await getRawData(handle);
    return analyzeWeakTopics(submissions, options);
}

async function fetchRatingHistory(handle) {
    const json = await fetchJson(
        `https://codeforces.com/api/user.rating?handle=${encodeURIComponent(handle)}`
    );

    return json.result.map((item) => ({
        date: new Date(item.ratingUpdateTimeSeconds * 1000).toISOString().split("T")[0],
        rating: item.newRating,
    }));
}

async function run(handle) {
    return getCFStats(handle);
}

module.exports = run;
module.exports.getCFStats = getCFStats;
module.exports.getCFSolveActivity = getCFSolveActivity;
module.exports.getCFWeakTopics = getCFWeakTopics;
module.exports.getCFAcceptedActivity = getCFAcceptedActivity;
module.exports.fetchRatingHistory = fetchRatingHistory;