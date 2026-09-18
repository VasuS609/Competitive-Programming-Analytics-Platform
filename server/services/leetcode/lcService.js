const { LeetCode } = require("leetcode-query");

const leetcode = new LeetCode(); // no Credential — public data only, works for any handle
const cache = {};

async function getCompleteUserData(handle) {
    
    const user = await leetcode.user(handle);

    if (!user || !user.matchedUser) {
        throw new Error("LeetCode user not found");
    }

    const { matchedUser, recentSubmissionList } = user;

    const counts = matchedUser.submitStats.acSubmissionNum;
    const find = (level) => counts.find(c => c.difficulty === level)?.count || 0;


    return {
        handle,
        totalSolved: find('All'),
        easySolved: find('Easy'),
        mediumSolved: find('Medium'),
        hardSolved: find('Hard'),
        recentSubmissions: recentSubmissionList || [],
        fetchedAt: new Date().toISOString()
    };
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


module.exports = { getLCStats };