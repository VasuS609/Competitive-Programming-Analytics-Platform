const { LeetCode } = require("leetcode-query");

const leetcode = new LeetCode(); // no Credential - public data only, works for any handle
const cache = {};
const CACHE_TTL = 10 * 60 * 1000;

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
        .filter((contest) => contest.attended && contest.rating && contest.contest?.startTime)
        .map((contest) => ({
            date: new Date(Number(contest.contest.startTime) * 1000).toISOString().slice(0, 10),
            rating: Math.round(Number(contest.rating)),
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
}

// Contest info fails or is empty for users who never took part in a contest.
// That must not take the whole LeetCode section down.
async function fetchContestInfo(handle) {
    try {
        return await leetcode.user_contest_info(handle);
    } catch (error) {
        console.warn("leetcode contest info unavailable for", handle, "-", error.message);
        return null;
    }
}

// Recent accepted submissions. The public API only exposes a short recent window,
// so this is a "recently solved" list, not the full solved list.
async function fetchRecentAccepted(handle, fallbackSubmissions) {
    let accepted = [];

    try {
        const res = await leetcode.graphql({
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
            });
        }
    });
    return [...unique.values()];
}

async function getCompleteUserData(handle) {
    const [user, contestInfo] = await Promise.all([
        leetcode.user(handle),
        fetchContestInfo(handle),
    ]);

    if (!user?.matchedUser) {
        const error = new Error(`LeetCode user "${handle}" not found`);
        error.status = 404;
        throw error;
    }

    const { matchedUser, recentSubmissionList } = user;
    const contestRanking = contestInfo?.userContestRanking;
    const rating = contestRanking?.rating ? Math.round(contestRanking.rating) : 0;

    const counts = matchedUser.submitStats?.acSubmissionNum || [];
    const find = (level) => counts.find((c) => c.difficulty === level)?.count ?? 0;

    const easySolved = find("Easy");
    const mediumSolved = find("Medium");
    const hardSolved = find("Hard");
    // Prefer LeetCode's own "All" bucket, fall back to summing the three levels.
    const totalSolved = find("All") || easySolved + mediumSolved + hardSolved;

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
        problems: await fetchRecentAccepted(handle, recentSubmissionList),
        recentSubmissions: recentSubmissionList || [],
        fetchedAt: new Date().toISOString(),
    };
}

async function getLCStats(handle) {
    const key = String(handle).trim().toLowerCase();
    const cached = cache[key];

    if (cached && Date.now() < cached.expiresAt) {
        console.log("leetcode cache hit for:", key);
        return cached.data;
    }

    console.log("leetcode cache miss for:", key);
    const data = await getCompleteUserData(String(handle).trim());
    cache[key] = { data, expiresAt: Date.now() + CACHE_TTL };
    return data;
}

// Reuses the cached profile fetch instead of hitting LeetCode a second time.
async function getLCRatingHistory(handle) {
    const stats = await getLCStats(handle);
    return stats.ratingHistory;
}

module.exports = { getLCStats, getLCRatingHistory };