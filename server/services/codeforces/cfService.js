const { getSolvedProblems, syncSolvedProblems } = require("../solvedProblemService");

const CACHE_TTL = 10 * 60 * 1000;
const WEAK_TOPIC_WINDOW = 150; // look at  N submissions
const DEFAULT_TZ_OFFSET_MIN = 330; // IST. 

// Verdicts that say nothing about topic weakness
const IGNORED_VERDICTS = new Set([
    "COMPILATION_ERROR",
    "SKIPPED",
    "TESTING",
    "CHALLENGED",
]);

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

/* AC: solved over time */

// Map of problemKey -> earliest accepted submission (the day it was first solved)
function getFirstSolves(submissions) {
    const first = new Map();

    for (const s of submissions) {
        if (s.verdict !== "OK" || !s.problem) continue;

        const key = problemKey(s.problem);
        const existing = first.get(key);

        if (!existing || s.creationTimeSeconds
             < existing.creationTimeSeconds) {

            first.set(key, s);
        }
    }
    return first;
}

function buildSolveActivity(firstSolves, tzOffsetMin = DEFAULT_TZ_OFFSET_MIN) {
   
    const perDay = {};

    for (const s of firstSolves.values()) {
        const d = toDate(s.creationTimeSeconds * 1000, tzOffsetMin);
        perDay[d] = (perDay[d] || 0) + 1;
    }

    const emptySummary = { today: 0, yesterday: 0, last7Days: 0, last30Days: 0, total: 0 };

    const dates = Object.keys(perDay).sort();

    if (!dates.length) {
        return { summary: emptySummary, daily: [], monthly: [], cumulative: [] };
    }

    const today = toDate(Date.now(), tzOffsetMin);
  
    const daily = dateRange(dates[0], today).map((date) => ({
        date,
        solved: perDay[date] || 0,
    }));

    let running = 0;
    const cumulative = daily.map(({ date, solved }) => ({ date, total: (running += solved) }));

    const monthlyMap = {};
    for (const { date, solved } of daily) {
        const month = date.slice(0, 7);
        monthlyMap[month] = (monthlyMap[month] || 0) + solved;
    }
    const monthly = Object.entries(monthlyMap).map(([month, solved]) => ({ month, solved }));

    const sumLast = (n) => daily.slice(-n).reduce((a, d) => a + d.solved, 0);

    return {
        summary: {
            today: daily[daily.length - 1].solved,
            yesterday: daily.length > 1 ? daily[daily.length - 2].solved : 0,
            last7Days: sumLast(7),
            last30Days: sumLast(30),
            total: running,
        },
        daily,      // [{ date, solved }]            -> daily bar/line chart
        monthly,    // [{ month, solved }]           -> monthly chart
        cumulative, // [{ date, total }]             -> "since the beginning" chart
    };
}

/* --------------------- non-AC: weak topic analysis --------------------- */

function analyzeWeakTopics(
    submissions,
    { window = WEAK_TOPIC_WINDOW, ignoreEventuallySolved = false } = {}
) {
    const solvedKeys = new Set(
        submissions.filter((s) => s.verdict === "OK" && s.problem).map((s) => problemKey(s.problem))
    );

    const recent = submissions
        .filter((s) => s.problem && !IGNORED_VERDICTS.has(s.verdict))
        .sort((a, b) => b.creationTimeSeconds - a.creationTimeSeconds)
        .slice(0, window);

    const tagStats = {};
    const recentFailures = [];

    for (const s of recent) {
        const isOk = s.verdict === "OK";
        const eventuallySolved = solvedKeys.has(problemKey(s.problem));
        const countsAsFailure = !isOk && !(ignoreEventuallySolved && eventuallySolved);

        if (countsAsFailure) {
            recentFailures.push({
                name: s.problem.name,
                verdict: s.verdict,
                tags: s.problem.tags,
                rating: s.problem.rating,
                eventuallySolved,
                url: problemUrl(s.problem),
                date: toDate(s.creationTimeSeconds * 1000),
            });
        }

        for (const tag of s.problem.tags || []) {
            const t = (tagStats[tag] ||= { tag, attempts: 0, failed: 0, accepted: 0 });
            t.attempts++;
            if (isOk) t.accepted++;
            else if (countsAsFailure) t.failed++;
        }
    }

    const weakTopics = Object.values(tagStats)
        .filter((t) => t.failed > 0)
        .map((t) => ({ ...t, failRate: Math.round((t.failed / t.attempts) * 100) }))
        .sort((a, b) => b.failed - a.failed || b.failRate - a.failRate);

    return {
        windowSize: recent.length,
        failedSubmissions: recentFailures.length,
        weakTopics,     // [{ tag, attempts, failed, accepted, failRate }]
        recentFailures, // the actual non-AC submissions behind the numbers
    };
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
module.exports.fetchRatingHistory = fetchRatingHistory;