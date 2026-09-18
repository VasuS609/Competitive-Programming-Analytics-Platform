import useStats from "../../hooks/platformStats/useStats";
import SubmissionCalendar from "../RatingChart/SubmissionCalendar";

function DetailedDashboard({handle, title, platform}){
    const {data, loading, error} = useStats({handle, platform});

    if(loading == true) {
        return <div>Loading your Dashboard...</div>
    }

    if(error != null){
        return <div>Unexpected Error Occured: {error.message}</div>
    }

    if(!data){
        return <div>No {platform} data found.</div>
    }

    return(
        <div>
            if(platform == "leetcode"){
               <div>
                <h2>{data.handle}</h2>
                <p>Total Solved: {data.totalSolved}</p>
                <p>Easy Solved: {data.easySolved}</p>
                <p>Medium Solved: {data.mediumSolved}</p>
                <p>Hard Solved: {data.hardSolved}</p>
                <p>Recent Submissions: {data.recentSubmissions.length}</p>
                <p>Fetched At: {data.fetchedAt}</p>
               </div> 

            }
            else if(platform == "codeforces")
            {
                <div>
                    <h2>{data.username}</h2>
                    <p>Rank: {data.rank}</p>
                    <p>Rating: {data.rating}</p>
                    <p>Problems solved: {data.problemSolved}</p>
                </div>
            }
            else if(platform == "codechef")
            {
                <div>
                        <h2>{data.name}</h2>
                        <h2>Rank: {data.rank}</h2>
                        <p>Stars: {data.stars}</p>
                        <p>Highest Rating: {data.highestRating}</p>
                        <p>Rating: {data.currentRating}</p>
                        <p>Problems solved: {data.problemSolved}</p>
                        <p>Country: {data.countryName}</p>
                        <p>Global Rank: {data.globalRank}</p>
                        <p>Country Rank: {data.countryRank}</p>
                        {/* <p>Heatmap: {JSON.stringify(data.heatMap)}</p> */}
                        {/* <<p>Rating Data: {JSON.stringify(data.ratingData)}</p> */}
                        
                </div>
            }
            
            
            <SubmissionCalendar handle={handle} title={title} useCalendar={platform} />
        </div>
    )
}

export default DetailedDashboard;