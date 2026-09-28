import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import useStats from "../../hooks/useStats";
import { useSubmissionCalendar} from "../../hooks/useSubmissionCalendar";

const platforms = [
  { id: "codeforces", label: "Codeforces" },
  { id: "codechef", label: "CodeChef" },
  { id: "leetcode", label: "LeetCode" },
];

function HomeDashboard({ handles }) {

  const codeforcesStats = useStats(handles.codeforces, "codeforces");
  const codechefStats = useStats(handles.codechef, "codechef");
  const leetcodeStats = useStats(handles.leetcode, "leetcode");

  const codeforcesCalendar = useSubmissionCalendar(handles.codeforces, "codeforces");
  const codechefCalendar = useSubmissionCalendar(handles.codechef, "codechef");
  const leetcodeCalendar = useSubmissionCalendar(handles.leetcode, "leetcode");

  const stats = [
    { id: "codeforces", ...codeforcesStats },
    { id: "codechef", ...codechefStats },
    { id: "leetcode", ...leetcodeStats },
  ];

  // Merge platforms by date (not by array index) so a shorter/failed calendar can't shift the days.
  const cfDays = codeforcesCalendar.data;
  const ccDays = codechefCalendar.data;
  const lcDays = leetcodeCalendar.data;

  const activity = useMemo(() => {
    const totals = new Map();

    [cfDays, ccDays, lcDays].forEach((days) => {
      days.forEach(({ date, count }) => {
        totals.set(date, (totals.get(date) || 0) + (Number(count) || 0));
      });
    });

    return [...totals.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, submissions]) => ({ date, submissions }));
  }, [cfDays, ccDays, lcDays]);

  const totalSolved = stats.reduce(
    (total, item) => total
    + (item.data?.problemSolved ?? item.data?.totalSolved ?? 0), 0);

  return (
    <section>

      <div className="summary-grid">
        <div className="stat-card">
          <span className="stat-label">Total solved</span>
          <strong className="stat-value">{totalSolved}</strong>
          <small className="stat-note">Across loaded profiles</small>
        </div>

        <div className="stat-card">
          <span className="stat-label">Platforms loaded</span>
          <strong className="stat-value">{stats.filter((item) => item.data).length}/3</strong>
          <small className="stat-note">Live profile data</small>
        </div>
      </div>

      <div className="content-grid">
        <section className="content-panel">
         
          <div className="panel-heading"><h3>Submissions, past 7 days</h3><span>Activity</span></div>

          {activity.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={activity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e0" />
                <XAxis dataKey="date" stroke="#1f1f1f" fontSize={12} />
                <YAxis allowDecimals={false} stroke="#1f1f1f" fontSize={12} />
                <Tooltip />
                <Bar dataKey="submissions" fill="#e4572e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="muted">Load at least one profile to see activity.</p>
          )}

        </section>

        <section className="content-panel">
          <div className="panel-heading"><h3>Current ratings</h3><span>Live data</span></div>
          {stats.map((item) => (
           
            <div className="rating-row" key={item.id}>
              <span>{platforms.find(({ id }) => id === item.id).label}</span>
              <strong>{item.loading ? "..." : item.data?.rating ?? item.data?.currentRating ?? "Unavailable"}</strong>
            </div>

          ))}
          
        </section>
      </div>

    </section>
  )
}

export default HomeDashboard;