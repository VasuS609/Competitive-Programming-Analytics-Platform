import {useCFStats} from "../hooks/useCFStats";
import SubmissionCalendar from "./SubmissionCalendar";
import { useCfSubmissions } from "../hooks/submissions/useCfSubmissions";

function CFDashboard({handle}){
    const {data, loading, error} = useCFStats(handle);
    
    if(loading === true){
        return <div>Loading your Dashboard...</div>
        
    }
    if(error != null){
        return <div>Unexpected error occured: {error.message}</div>
    }

    if(!data){
        return <div>No Codeforces data found.</div>
    }
    
    return (
        
        <div>
            <h2>{data.username}</h2>
            <p>Rank: {data.rank}</p>
            <p>Rating: {data.rating}</p>
            <p>Problems solved: {data.problemSolved}</p>
            <SubmissionCalendar handle={handle} title="Codeforces" useCalendar={useCfSubmissions} />
        </div>
        
    )
}

export default CFDashboard;