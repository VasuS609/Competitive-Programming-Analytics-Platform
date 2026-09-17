import {useLeetcodeStats} from '../hooks/useLeetcodeStats';

function LeetcodeDashboard({handle}){
    const {data, loading, error} = useLeetcodeStats({handle});

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
            <h2>{data.handle}</h2>
            <p>Total Solved: {data.totalSolved}</p>
            <p>Easy Solved: {data.easySolved}</p>
            <p>Medium Solved: {data.mediumSolved}</p>
            <p>Hard Solved: {data.hardSolved}</p>
            <p>Recent Submissions: {data.recentSubmissions.length}</p>
            <p>Fetched At: {data.fetchedAt}</p>
        </div>
    )
}

export default LeetcodeDashboard;