import { Bar, BarChart, CartesianGrid, Legend, Radar, RadarChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import useStats from "../../hooks/useStats";
import useHeatmap from "../../hooks/useHeatmap";
import ActivityHeatmap from "../../components/ActivityHeatmap";
import { useTotalAccepted } from "../../hooks/useTotalAccepted";
import { useProfile } from "../../context/useProfile";
import { SUPPORTED_PLATFORMS } from "../../config/platforms";

const HEATMAP_MONTHS = 3;

function HomeDashboard({ handles }) {
  const { days } = useProfile();
  const totalAccepted = useTotalAccepted(handles, days);
  const heatmap = useHeatmap(handles, HEATMAP_MONTHS);

  const codeforcesStats = useStats(handles.codeforces, "codeforces");
  const leetcodeStats = useStats(handles.leetcode, "leetcode");
  const githubStats = useStats(handles.github, "github");

  const statsByPlatform = [
    { id: "codeforces", ...codeforcesStats },
    { id: "leetcode", ...leetcodeStats },
    { id: "github", ...githubStats },
  ];

  const totalSolved = statsByPlatform.reduce(
    (total, item) =>
      total +
      (item.data?.platform === "github"
        ? 0
        : Number(item.data?.problemSolved ?? item.data?.totalSolved ?? 0)),
    0,
  );
  const radarValues = [
    { subject: "CP",  value: heatmap.data?.totals.cp  ?? 0 },
    { subject: "DSA", value: heatmap.data?.totals.dsa ?? 0 },
    { subject: "Dev", value: heatmap.data?.totals.dev ?? 0 },
  ];
  const failedPlatforms = Object.keys(heatmap.data?.errors || {});

  return (
    <section>
      <div className="analytics-grid">
        <section className="content-panel heat-map-panel">

          <h3>Cross-platform activity</h3>

          {!heatmap.hasHandles ? <p className="muted">Add a profile handle to see your activity.</p> : heatmap.loading ? <p className="muted">Loading activity...</p> : heatmap.error ? <p className="muted">Activity unavailable: {heatmap.error.message}</p> : heatmap.data ? <ActivityHeatmap data={heatmap.data} /> : null}
          {failedPlatforms.length > 0 && <p className="muted heatmap-warning">Could not load: {failedPlatforms.join(", ")}</p>}
        </section>

        <section className="content-panel radar-panel">

          <div className="panel-heading">
            <h3>Direction</h3>
            <span>Last {HEATMAP_MONTHS} months</span>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <RadarChart
              data={radarValues}
              margin={{ top: 20, right: 30, bottom: 20, left: 30 }}
            >
              <PolarGrid stroke="#e5e5e0" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: "#17211b", fontSize: 12, fontWeight: 600 }}
              />
              <PolarRadiusAxis
                angle={90}
                orientation="right"
                stroke="#89958d"
                allowDecimals={false}
                tick={{ fontSize: 10, fill: "#89958d" }}
              />
              <Radar
                dataKey="value"
                stroke="#899e20"
                fill="#d6ef4f"
                fillOpacity={0.55}
              />
              <Tooltip />

            </RadarChart>
          </ResponsiveContainer>

        </section>
      </div>

      <div className="content-grid">
        <section className="content-panel">
         
          <div className="panel-heading">
            <h3>Submissions per day</h3>
            <span>Last {days} days</span>
          </div>

          {totalAccepted.loading ? (
            <p className="muted">Loading submissions...</p>
          ) : totalAccepted.error ? (
            <p className="muted">Submissions unavailable: {totalAccepted.error.message}</p>
          ) : totalAccepted.data?.daily?.length ? (
            <ResponsiveContainer width="100%" height={240}>

              <BarChart data={totalAccepted.data.daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e0" />
                <XAxis dataKey="date" stroke="#1f1f1f" fontSize={12} />
                <YAxis allowDecimals={false} stroke="#1f1f1f" fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="submissions" name="Total submissions" fill="#2f80ed" radius={[4, 4, 0, 0]} />
                <Bar dataKey="accepted" name="Accepted" fill="#899e20" radius={[4, 4, 0, 0]} />
                <Bar dataKey="nonAccepted" name="Non-accepted" fill="#e4572e" radius={[4, 4, 0, 0]} />
              </BarChart>
              
            </ResponsiveContainer>
          ) : (
            <p className="muted">No submission data is available for the selected profiles.</p>
          )}

        </section>


      <div className="summary-grid">
        
        <div className="stat-card">
          <span className="stat-label">Total solved</span>
          <strong className="stat-value">{totalSolved}</strong>
          <small className="stat-note">Across loaded profiles</small>
        </div>

        <div className="stat-card">
          <span className="stat-label">Platforms loaded</span>
          <strong className="stat-value">{statsByPlatform.filter((item) => item.data).length}/{Object.values(handles).filter(Boolean).length}</strong>
          <small className="stat-note">Live profile data</small>
        </div>
        

        <section className="content-panel">
          <div className="panel-heading">
            <h3>Current ratings</h3>
            <span>Live data</span>
          </div>
          {statsByPlatform.map((item) => (
           
            <div className="rating-row" key={item.id}>
              <span>{SUPPORTED_PLATFORMS.find(({ id }) => id === item.id)?.label}</span>
              <strong>{item.loading ? "..." : item.data?.rating ?? item.data?.currentRating ?? "Unavailable"}</strong>
            </div>

          ))}
          
        </section>
      </div>

        
      </div>

    </section>
  )
}

export default HomeDashboard;
