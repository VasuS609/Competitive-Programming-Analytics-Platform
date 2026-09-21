import { useState } from "react";
import useStats from "../../hooks/platformStats/useStats";
import SubmissionCalendar from "../submissions/SubmissionCalendar";
import RatingChart from "../RatingChart/RatingChart";

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
                <div><p className="eyebrow">{title}</p><h2>{displayName}</h2></div>
                <span className="platform-badge">{platform}</span>
            </div>
            <div className="metric-grid">
                {details.map(([label, value]) => <div className="metric" key={label}><span>{label}</span><strong>{value}</strong></div>)}
            </div>
            <div className="chart-grid">
                <RatingChart handle={handle} platform={platform} title={title} />
                <SubmissionCalendar handle={handle} platform={platform} title={title} />
            </div>
            <ProblemTable problems={data.problems || []} />
        </section>
    );
}

function ProblemTable({ problems }) {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const pageCount = Math.max(1, Math.ceil(problems.length / pageSize));
    const visibleProblems = problems.slice((page - 1) * pageSize, page * pageSize);

    return <section className="table-panel">
        <div className="table-heading"><h3>Solved problems</h3><label>Rows <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}><option value="10">10</option><option value="20">20</option></select></label></div>
        {!problems.length ? <p className="muted">Problem details are not available for this platform.</p> : <>
            <div className="problem-list">{visibleProblems.map((problem, index) => <div className="problem-row" key={`${problem.id}-${problem.index}-${index}`}><span>{problem.name}</span><small>{problem.rating || "Unrated"}</small></div>)}</div>
            <div className="pagination"><button disabled={page === 1} onClick={() => setPage((current) => current - 1)}>Previous</button><span>Page {page} of {pageCount}</span><button disabled={page === pageCount} onClick={() => setPage((current) => current + 1)}>Next</button></div>
        </>}
    </section>;
}

export default DetailedDashboard;