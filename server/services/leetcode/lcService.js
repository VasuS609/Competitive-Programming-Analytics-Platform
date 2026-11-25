const { createTtlCache } = require("../../utils/ttlCache");
const { LeetCode } = require("leetcode-query");
const { getSolvedProblems, syncSolvedProblems } = require("../solvedProblemService");
const { getLastNDates, safeDay } = require("../../utils/dates");

let _lc;
function getLCClient() {
    if (!_lc) _lc = new LeetCode();
    return _lc;
} 
const { handleKey } = require("../../utils/helpers");
const statsCache = createTtlCache();

const RECENT_AC_QUERY = `query recentAcSubmissions($username: String!, $limit: Int!) {
  recentAcSubmissionList(username: $username, limit: $limit) {
    id
    title
    titleSlug
    timestamp
  }
}`;

function normalizeRatingHistory(history) {
    if (!Array.isArray(history)) return [];

    return history
        .filter((contest) => contest.attended && contest.rating != null && contest.contest?.startTime != null)
        .map((contest) => ({
            date: safeDay(contest.contest.startTime),
            rating: Number(contest.rating),
        }))
        .filter((contest) => contest.date !== null && Number.isFinite(contest.rating))
        .sort((a, b) => a.date.localeCompare(b.date));
}



async function fetchContestInfo(handle) {
    try {
        return await getLCClient().user_contest_info(handle);
    } catch (error) {
        console.warn("leetcode contest info unavailable for", handle, "-", error.message);
        return null;
    }
}


async function fetchRecentAccepted(handle, fallbackSubmissions) {
    let accepted = [];

    try {
        const res = await getLCClient().graphql({
            query: RECENT_AC_QUERY,
            variables: { username: handle, limit: 50 },
        });
        accepted = res?.data?.recentAcSubmissionList || [];
    } catch (error) {
        console.warn("leetcode recent AC list unavailable for", handle, "-", error.message);
    }

    if (!accepted.length) {
        accepted = (fallbackSubmissions || []).filter((s) => s.statusDisplay === "Accepted");
    }

    const unique = new Map();
    accepted.forEach((submission) => {
        if (!unique.has(submission.titleSlug)) {
            unique.set(submission.titleSlug, {
                id: submission.titleSlug,
                name: submission.title,
                rating: null,
                url: `https://leetcode.com/problems/${submission.titleSlug}/`,
            });
        }
    });
    return [...unique.values()];
}

async function getCompleteUserData(handle) {
    const [user, contestInfo] = await Promise.all([
        getLCClient().user(handle),
        fetchContestInfo(handle),
    ]);

    if (!user?.matchedUser) {
        const error = new Error(`LeetCode user "${handle}" not found`);
        error.status = 404;
        throw error;
    }

    const { matchedUser, recentSubmissionList } = user;
    const contestRanking = contestInfo?.userContestRanking;
    const ratingValue = contestRanking?.rating;
    const ratingNumber = ratingValue == null || ratingValue === "" ? null : Number(ratingValue);
    const rating = Number.isFinite(ratingNumber) ? ratingNumber : null;

    const counts = matchedUser.submitStats?.acSubmissionNum || [];
    const find = (level) => counts.find((c) => c.difficulty === level)?.count ?? 0;

    const easySolved = find("Easy");
    const mediumSolved = find("Medium");
    const hardSolved = find("Hard");
   
    
    const totalSolved = find("All") || easySolved + mediumSolved + hardSolved;

    const recentProblems = await fetchRecentAccepted(handle, recentSubmissionList);
    await syncSolvedProblems("leetcode", handle, recentProblems);

    return {
        handle,
        totalSolved,
        problemSolved: totalSolved,
        easySolved,
        mediumSolved,
        hardSolved,
        rank: matchedUser.profile?.ranking || null,
        globalRank: matchedUser.profile?.ranking || null,
        contestGlobalRank: contestRanking?.globalRanking || null,
        rating,
        currentRating: rating,
        ratingHistory: normalizeRatingHistory(contestInfo?.userContestRankingHistory),
        submissionCalendar: matchedUser.submissionCalendar || "{}",
        problems: getSolvedProblems("leetcode", handle),
        recentSubmissions: recentSubmissionList || [],
        recentSubmissionsAvailable: Array.isArray(recentSubmissionList),
        recentSubmissionList: recentSubmissionList || [],
        fetchedAt: new Date().toISOString(),
    };
}

function getLCStats(handle, options) {
  return statsCache.get(handleKey(handle), () => getCompleteUserData(String(handle).trim()), options);
}

async function getLCRatingHistory(handle) {
    const stats = await getLCStats(handle);
    return stats.ratingHistory;
}

async function getLCAcceptedActivity(handle, days = 7) {
    const stats = await getLCStats(handle);
    const dates = new Set(getLastNDates(days));
    const acceptedByDate = new Map();

    for (const submission of stats.recentSubmissionList || []) {
        const date = safeDay(submission.timestamp);
        if (submission.statusDisplay !== "Accepted" || !date || !dates.has(date)) continue;

        if (!acceptedByDate.has(date)) acceptedByDate.set(date, new Set());
        acceptedByDate.get(date).add(submission.titleSlug || submission.title);
    }

    return [...acceptedByDate.entries()].map(([date, problems]) => ({
        date,
        accepted: problems.size,
    }));
}

module.exports = { getLCStats, getLCRatingHistory, getLCAcceptedActivity };
