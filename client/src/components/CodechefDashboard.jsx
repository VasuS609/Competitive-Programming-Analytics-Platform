import {useCodechefStats} from '../hooks/useCodechefStats';
import SubmissionCalendar from './SubmissionCalendar';
import { useCcSubmissions } from '../hooks/submissions/useCcSumissions';


function CodechefDashboard({handle}){
    const {data, loading, error} = useCodechefStats(handle);

    if(loading === true){
        return <div>Loading your Dashboard...</div>
    }

    if(error != null){
        return <div>Unexpected error occured: {error.message}</div>
    }

    if(!data){
        return <div>No Codechef data found.</div>
    }

    return (
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
            <SubmissionCalendar handle={handle} title="CodeChef" useCalendar={useCcSubmissions} />
            {/* <p>Heatmap: {JSON.stringify(data.heatMap)}</p> */}
            {/* <<p>Rating Data: {JSON.stringify(data.ratingData)}</p> */}
                 
        </div>

        )
}

export default CodechefDashboard;