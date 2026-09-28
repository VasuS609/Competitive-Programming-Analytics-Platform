import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import useStats from "../../hooks/useStats";
import { useSubmissionCalendar} from "../../hooks/useSubmissionCalendar";
import { useProfile } from "../../context/useProfile";

const platforms = [
  { id: "codeforces", label: "Codeforces", color: "#e4572e" },
  { id: "codechef", label: "CodeChef", color: "#2f80ed" },
  { id: "leetcode", label: "LeetCode", color: "#f2c94c" },
];

function HomeDashboard({ handles }) {
  const { days, setDays } = useProfile();

  const codeforcesStats = useStats(handles.codeforces, "codeforces");
  const codechefStats = useStats(handles.codechef, "codechef");
  const leetcodeStats = useStats(handles.leetcode, "leetcode");

  const codeforcesCalendar = useSubmissionCalendar(handles.codeforces, "codeforces", days);
  const codechefCalendar = useSubmissionCalendar(handles.codechef, "codechef", days);
  const leetcodeCalendar = useSubmissionCalendar(handles.leetcode, "leetcode", days);

  const stats = [
    { id: "codeforces", ...codeforcesStats },
    { id: "codechef", ...codechefStats },
    { id: "leetcode", ...leetcodeStats },
  ];


  
  const calendars = [
    { ...codeforcesCalendar, ...platforms[0], handle: handles.codeforces },
    { ...codechefCalendar, ...platforms[1], handle: handles.codechef },
    { ...leetcodeCalendar, ...platforms[2], handle: handles.leetcode },
  ];

  const activity = useMemo(() => {
    const successfulCalendars = calendars.filter(({ handle, error }) => handle && !error);
    const dates = [...new Set(successfulCalendars.flatMap(({ data }) => data.map(({ date }) => date)))].sort();

    return dates.map((date) => {
      const row = { date };
      successfulCalendars.forEach(({ id, data }) => {
        row[id] = data.find((item) => item.date === date)?.count || 0;
      });
      return row;
    });
  }, [calendars]);

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
         
          <div className="panel-heading">
            <h3>Submissions</h3>
            <div className="range-toggle" aria-label="Submission range">
              {[7, 30].map((range) => (
                <button
                  key={range}
                  type="button"
                  className={days === range ? "active" : ""}
                  onClick={() => setDays(range)}
                >
                  {range}d
                </button>
              ))}
            </div>
          </div>

          {activity.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={activity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e0" />
                <XAxis dataKey="date" stroke="#1f1f1f" fontSize={12} />
                <YAxis allowDecimals={false} stroke="#1f1f1f" fontSize={12} />
                <Tooltip />
                <Legend />
                {platforms.filter(({ id }) => handles[id]).map(({ id, label, color }) => (
                  <Bar key={id} dataKey={id} name={label} stackId="submissions" fill={color} radius={[4, 4, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="muted">No submission activity is available for the selected profiles.</p>
          )}

          {calendars.filter(({ handle, error }) => handle && error).map(({ id, label, error }) => (
            <p className="muted" key={id}>{label} submissions unavailable: {error.message}</p>
          ))}

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