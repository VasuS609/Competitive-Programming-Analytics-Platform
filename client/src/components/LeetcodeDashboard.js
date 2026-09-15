const { default: useLeetcodeStats } = require("../hooks/useLeetcodeStats");

function LeetcodeDashboard({handle}){
    const {data, loading, error} = useLeetcodeStats(handle);

    if(loading == true) {
        return <div>Loading your Dashboard...</div>
    }

    if(error != null){
        return <div>Unexpected Error Occured: {error.message}</div>
    }

    if(!data){
        return <div>No Leetcode data found.</div>
    }

    return(
        <div>
            <h2>{data.username}</h2>
            <p>Rank: {data.rank}</p>
            <p>Rating: {data.rating}</p>
            <p>Problems solved: {data.problemSolved}</p>
        </div>
    )
}