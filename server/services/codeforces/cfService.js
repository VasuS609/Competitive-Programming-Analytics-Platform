//todo: add simple in-mem cache 

const cache = {};

async function fetchFromCF(handle){

    const [userSubmission, userProfile] = await Promise.all([
        fetchJson(`https://codeforces.com/api/user.status?handle=${handle}`),
        fetchJson(`https://codeforces.com/api/user.info?handles=${handle}`)
    ]);

    //todo: implement filter to result to only verdict === 'OK'
    const requiredSubmission = userSubmission.result.filter(s => s.verdict === 'OK');

    //todo: dedupe by problem.contestID + '-' + problem.index (use set or map)
    const uniqueResultMap = new Map(
        requiredSubmission.map(s => [`${s.problem.contestId} - ${s.problem.index}`, s])
    )
    

    //todo: log the count of unique solved problem and log just first 3 deduped problem (with rating and tags)
    const uniqueSubmissions = [...uniqueResultMap.values()];
    const profile = userProfile.result[0];

    const response = {
        username: profile.handle,
        rank: profile.rank || 'Unrated',
        rating: profile.rating || 0,
        problemSolved: uniqueSubmissions.length,
        problems: uniqueSubmissions.map(s => ({
            name: s.problem.name,
            rating: s.problem.rating,
            id: s.problem.contestId,
            index: s.problem.index,
            tags: s.problem.tags
        }))
    };

    return response;

    // fetch -> filter ok -> deduplicate -> count total number of problem solved -> log result

}


async function fetchJson(url){
    const response = await fetch(url);
    
    if(!response.ok){
        const text = await response.text();
        throw new Error(`Codeforces API Error ${response.status}: ${text.slice(0, 200)}`);
    }

    return await response.json();
}


async function fetchRatingHistory(handle) {
    const resposne = await fetch(`https://codeforces.com/api/user.rating?handle=${handle}`);
    const json = await resposne.json();


    const data = json.result.map(item => {
        const date = new Date(
            item.ratingUpdateTimeSeconds * 1000
        ).toISOString().split('T')[0];
        const rating = item.newRating;

        return {date, rating};
    })

    return data;
}

async function getCFStats(handle){
    const cached =  cache[handle];

    if(cached && Date.now() < cached.expiresAt){
        console.log('codeforces Cache Hit: for', handle);
        return cached.data;

    }else{
        console.log('chache miss... fetching fresh data for', handle);
        const data = await fetchFromCF(handle);
        cache[handle] = {
            data,
            expiresAt: Date.now() + 10*60*1000
        }
        return data;
    }   
}

async function run(handle){
    const data = await getCFStats(handle);
    return data;
}

module.exports = run;
module.exports.getCFStats = getCFStats;
module.exports.fetchRatingHistory = fetchRatingHistory;