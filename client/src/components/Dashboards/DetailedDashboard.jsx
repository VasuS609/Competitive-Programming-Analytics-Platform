import ProblemTable from "../blocks/ProblemTable";
import useStats from "../../hooks/useStats";
import SubmissionCalendar from "../submissions/SubmissionCalendar";
import RatingChart from "../Chart/RatingChart";

//below, footer, more detiled view
function DetailedDashboard({ handle, title, platform }) {
    const { data, loading, error } = useStats(handle, platform);

    if(loading == true) {
        return <div className="status-panel">Loading your dashboard...</div>;
    }

    if(error != null){
        return <div className="status-panel error">Could not load {title}: {error.message}</div>;
    }

    if(!data){
        return <div className="status-panel">No {title} data found.</div>;
    }

    const displayName = data.username || data.name || data.handle || handle;
    
    const details = [
        ["Solved", data.problemSolved ?? data.totalSolved ?? 0],
        ["Rating", data.rating ?? data.currentRating ?? "Unavailable"],
        ["Rank", data.rank ?? data.globalRank ?? "Unavailable"],
        ["Easy", data.easySolved ?? "Unavailable"],
        ["Medium", data.mediumSolved ?? "Unavailable"],
        ["Hard", data.hardSolved ?? "Unavailable"],
    ];

    return (
        <section className="dashboard-stack">

            <div className="dashboard-heading">
                <div>
                    <p className="eyebrow">
                        {title}
                    </p>
                    <h2>{displayName}</h2>
                </div>

                <span className="platform-badge">{platform}</span>
            </div>

            <div className="metric-grid">
                {details.map(
                    ([label, value]) => 
                    
                    <div className="metric" key={label}>
                        <span>{label}</span>
                        <strong>{value}</strong>
                    </div>)}
            </div>

            <div className="chart-grid">

                <RatingChart handle={handle} platform={platform} title={title} />

                <SubmissionCalendar handle={handle} platform={platform} title={title} />

            </div>

            <ProblemTable problems={data.problems || []} />

        </section>
    );
}


export default DetailedDashboard;