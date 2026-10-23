import ProblemTable from "./components/ProblemTable";
import useStats from "../../hooks/useStats";
import SubmissionCalendar from "./components/SubmissionCalendar";
import RatingChart from "./components/RatingChart";
import { usePlatformSync } from "../../hooks/usePlatformSync";
import { useProfile } from "../../context/useProfile";

//below, footer, more detiled view
function DetailedDashboard({ handle, title, platform }) {
    const { days } = useProfile();
    const { data, loading, error } = useStats(handle, platform);
    const { sync, data: syncData, loading: syncing, error: syncError } = usePlatformSync(platform, handle);

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

    const details = platform === "github"
        ? [
            ["Commits (30d)", data.totalCommits ?? 0],
            ["Repositories", data.publicRepos ?? data.repositories?.length ?? 0],
            ["Followers", data.followers ?? 0],
            ["Following", data.following ?? 0],
        ]
        : [
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
                    <button type="button" onClick={sync} disabled={syncing} className="tab-button">
                        {syncing ? "Syncing..." : "Sync solved problems"}
                    </button>
            </div>
            {syncError && <p className="text-sm text-red-600">Sync failed: {syncError.message}</p>}
            {syncData && <p className="text-sm text-ink/60">Synced {syncData.syncedCount} solved problems.</p>}

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

                <SubmissionCalendar handle={handle} platform={platform} title={title} days={days} />

            </div>

            {platform === "github" && (
                <section className="content-panel">
                    <div className="panel-heading">
                        <h3>GitHub commits per day</h3>
                        <span>Last 30 days</span>
                    </div>
                    <div className="problem-list">
                        {Object.entries(data.commitsByDay || {}).map(([date, commits]) => (
                            <div className="problem-row" key={date}>
                                <span>{date}</span>
                                <small>{commits} {commits === 1 ? "commit" : "commits"}</small>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <ProblemTable
                platform={platform}
                problems={data.problems || []}
                totalSolved={data.totalSolved ?? data.problemSolved}
                heading={platform === "leetcode" ? "Recently solved problems" : "Solved problems"}
            />

        </section>
    );
}


export default DetailedDashboard;