import ProblemTable from "../../components/blocks/ProblemTable";
import useStats from "../../hooks/useStats";
import SubmissionCalendar from "../../components/submissions/SubmissionCalendar";
import RatingChart from "../../components/Chart/RatingChart";

//below, footer, more detiled view
function DetailedDashboard({ handle, title, platform }) {
    const { data, loading, error } = useStats(handle, platform);

    if(loading == true) {
        return <div className="rounded-2xl bg-paper p-5 text-sm text-ink/60 shadow-sm">Loading your dashboard...</div>;
    }

    if(error != null){
        return <div className="rounded-2xl bg-paper p-5 text-sm text-red-600 shadow-sm">Could not load {title}: {error.message}</div>;
    }

    if(!data){
        return <div className="rounded-2xl bg-paper p-5 text-sm text-ink/60 shadow-sm">No {title} data found.</div>;
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

                <div className="detail-heading">
                    <h2>{displayName}</h2>
                    <span className="platform-badge">{platform}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {details.map(
                    ([label, value]) =>

                    <div className="metric" key={label}>
                        <span>{label}</span>
                        <strong>{value}</strong>
                    </div>)}
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

                <RatingChart handle={handle} platform={platform} title={title} />

                <SubmissionCalendar handle={handle} platform={platform} title={title} />

            </div>

            <ProblemTable problems={data.problems || []} />

        </section>
    );
}


export default DetailedDashboard;