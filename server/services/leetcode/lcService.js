const { LeetCode } = require("leetcode-query");

const leetcode = new LeetCode(); // no Credential — public data only, works for any handle
const cache = {};

function normalizeRatingHistory(history) {
    if (!Array.isArray(history)) return [];

    return history
        .filter((contest) => contest.attended && contest.rating && contest.contest?.startTime)
        .map((contest) => ({
            date: new Date(Number(contest.contest.startTime) * 1000).toISOString().slice(0, 10),
            rating: Number(contest.rating),
        }));
}

async function getCompleteUserData(handle) {
    const [user, contestInfo] = await Promise.all([
        leetcode.user(handle),
        leetcode.user_contest_info(handle),
    ]);

    if (!user || !user.matchedUser) {
        throw new Error("LeetCode user not found");
    }

    const { matchedUser, recentSubmissionList } = user;
    const contestRanking = contestInfo?.userContestRanking;

    const counts = matchedUser.submitStats.acSubmissionNum;
    const find = (level) => counts.find(c => c.difficulty === level)?.count || 0;


    return {
        handle,
        totalSolved: find('All'),
        easySolved: find('Easy'),
        mediumSolved: find('Medium'),
        hardSolved: find('Hard'),
        rank: matchedUser.profile?.ranking || null,
        globalRank: matchedUser.profile?.ranking || null,
        rating: contestRanking?.rating || 0,
        currentRating: contestRanking?.rating || 0,
        ratingHistory: normalizeRatingHistory(contestInfo?.userContestRankingHistory),
        recentSubmissions: recentSubmissionList || [],
        fetchedAt: new Date().toISOString()
    };
}

async function getLCRatingHistory(handle) {
    const contestInfo = await leetcode.user_contest_info(handle);
    return normalizeRatingHistory(contestInfo?.userContestRankingHistory);
}

async function getLCStats(handle) {
    const cached = cache[handle];

    if(cached && Date.now() < cached.expiresAt){
        console.log('leetcode cache hit for: ', handle);
        return cached.data;
    }
    else
    {
        console.log('leetcode cache miss for: ', handle);
        const data = await getCompleteUserData(handle);

        cache[handle] = {
            data, expiresAt: Date.now() + 10  * 60 * 1000
        };
        
        return data;        
    }


}


module.exports = { getLCStats, getLCRatingHistory };