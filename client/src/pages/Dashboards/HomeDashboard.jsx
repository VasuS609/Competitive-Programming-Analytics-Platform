import { useEffect, useMemo, useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, Radar, RadarChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import useStats from "../../hooks/useStats";
import { useSubmissionCalendar} from "../../hooks/useSubmissionCalendar";
import { useProfile } from "../../context/useProfile";

const platforms = [
  { id: "codeforces", label: "Codeforces", color: "#e4572e" },
  { id: "codechef", label: "CodeChef", color: "#2f80ed" },
  { id: "leetcode", label: "LeetCode", color: "#f2c94c" },
  { id: "gfg", label: "GeeksForGeeks", color: "#2f8d46" },
  { id: "github", label: "GitHub", color: "#24292f" },
  { id: "atcoder", label: "AtCoder", color: "#111827" },
];

function buildActivity(calendars) {
  const successfulCalendars = calendars.filter(({ handle, error }) => handle && !error);
  const dates = [...new Set(successfulCalendars.flatMap(({ data }) => data.map(({ date }) => date)))].sort();

  return dates.map((date) => {
    const row = { date };
    successfulCalendars.forEach(({ id, data }) => {
      row[id] = data.find((item) => item.date === date)?.count || 0;
    });
    return row;
  });
}

function getAcceptedCount(statsItem) {
  return Number(
    statsItem?.data?.accepted ??
    statsItem?.data?.problemSolved ??
    statsItem?.data?.totalSolved ??
    0,
  ) || 0;
}

function HomeDashboard({ handles }) {
  const { days, setDays } = useProfile();
  const heatMapRef = useRef(null);
  const [hoveredDate, setHoveredDate] = useState(null);

  const codeforcesStats = useStats(handles.codeforces, "codeforces");
  const codechefStats = useStats(handles.codechef, "codechef");
  const leetcodeStats = useStats(handles.leetcode, "leetcode");
  const gfgStats = useStats(handles.gfg, "gfg");
  const githubStats = useStats(handles.github, "github");
  const atcoderStats = useStats(handles.atcoder, "atcoder");

  const codeforcesCalendar = useSubmissionCalendar(handles.codeforces, "codeforces", days);
  const codechefCalendar = useSubmissionCalendar(handles.codechef, "codechef", days);
  const leetcodeCalendar = useSubmissionCalendar(handles.leetcode, "leetcode", days);
  const gfgCalendar = useSubmissionCalendar(handles.gfg, "gfg", days);
  const githubCalendar = useSubmissionCalendar(handles.github, "github", days);
  const atcoderCalendar = useSubmissionCalendar(handles.atcoder, "atcoder", days);

  const stats = [
    { id: "codeforces", ...codeforcesStats },
    { id: "codechef", ...codechefStats },
    { id: "leetcode", ...leetcodeStats },
    { id: "gfg", ...gfgStats },
    { id: "github", ...githubStats },
    { id: "atcoder", ...atcoderStats },
  ];


  
  const calendars = [
    { ...codeforcesCalendar, ...platforms[0], handle: handles.codeforces },
    { ...codechefCalendar, ...platforms[1], handle: handles.codechef },
    { ...leetcodeCalendar, ...platforms[2], handle: handles.leetcode },
    { ...gfgCalendar, ...platforms[3], handle: handles.gfg },
    { ...githubCalendar, ...platforms[4], handle: handles.github },
    { ...atcoderCalendar, ...platforms[5], handle: handles.atcoder },
  ];

  const activity = buildActivity(calendars);
  const activityByDate = useMemo(() => activity.reduce((result, row) => {
    result[row.date] = platforms
      .map(({ id, label }) => ({ id, label, count: row[id] || 0 }))
      .filter(({ count }) => count > 0);
    return result;
  }, {}), [activity]);
  const activityKey = JSON.stringify(activityByDate);

  useEffect(() => {
    const container = heatMapRef.current;
    const heat = window.$heat;
    if (!container || !heat) return undefined;

    container.setAttribute("data-heat-js", "{ 'defaultView': 'map' }");
    document.dispatchEvent(new Event("DOMContentLoaded"));

    const populate = () => {
      const [id] = heat.getIds();
      if (!id) return;
      heat.reset(id, false);
      const currentActivity = JSON.parse(activityKey);
      Object.entries(currentActivity).forEach(([date, entries]) => {
        const total = entries.reduce((sum, entry) => sum + entry.count, 0);
        for (let index = 0; index < total; index += 1) {
          heat.addDate(id, new Date(`${date}T12:00:00Z`), "Activity", false);
        }
      });
      heat.refresh(id);
    };

    const timer = window.setTimeout(populate, 0);
    const handleMouseOver = (event) => {
      const cell = event.target.closest("[data-heat-js-map-date]");
      const date = cell?.getAttribute("data-heat-js-map-date");
      if (date) setHoveredDate(date);
    };
    container.addEventListener("mouseover", handleMouseOver);

    return () => {
      window.clearTimeout(timer);
      container.removeEventListener("mouseover", handleMouseOver);
      const [id] = heat.getIds();
      if (id) heat.destroy(id);
    };
  }, [activityKey]);

  const totalSolved = stats.reduce(
    (total, item) => total
    + (item.data?.problemSolved ?? item.data?.totalSolved ?? 0), 0);
  const radarValues = [
    {
      subject: "CP",
      value: Math.round((getAcceptedCount(codeforcesStats) + getAcceptedCount(codechefStats) + getAcceptedCount(atcoderStats)) / 3),
    },
    {
      subject: "DSA",
      value: Math.round((getAcceptedCount(leetcodeStats) + getAcceptedCount(gfgStats)) / 2),
    },
    { subject: "Dev", value: getAcceptedCount(githubStats) },
  ];
  const hoveredEntries = activityByDate[hoveredDate] || [];

  return (
    <section>
      <div className="analytics-grid">
        <section className="content-panel heat-map-panel">
          <h3>Cross-platform activity</h3>
          <div id="heat-map" ref={heatMapRef} data-heat-js="{ 'defaultView': 'map' }"></div>
          <div className="heat-map-details" aria-live="polite">
            <strong>{hoveredDate || "Hover a day"}</strong>
            {hoveredEntries.length ? hoveredEntries.map(({ id, label, count }) => (
              <span key={id}>
                {label} - {count} {id === "github" ? (count === 1 ? "event" : "events") : id === "atcoder" ? (count === 1 ? "contest" : "contests") : id === "gfg" ? (count === 1 ? "activity" : "activities") : "AC"}
              </span>
            )) : <span>No accepted activity</span>}
          </div>
        </section>
        <section className="content-panel radar-panel">
          <div className="panel-heading">
            <h3>Direction</h3>
            <span>Accepted activity</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarValues}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis allowDecimals={false} />
              <Radar dataKey="value" stroke="#899e20" fill="#d6ef4f" fillOpacity={0.55} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </section>
      </div>

      <div className="content-grid">
        <section className="content-panel">
         
          <div className="panel-heading">
            <h3>Accepted problems per day</h3>
            <div className="range-toggle" aria-label="Accepted problem range">
              {[7, 30].map((range) => (
                <button
                  key={range}
                  type="button"
                  className={days === range ? "active" : ""}
                  onClick={() => setDays(range)}
                >
                  {range}
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
                {calendars.filter(({ handle, error, loading }) => handle && !error && !loading).map(({ id, label, color }) => (
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


      <div className="summary-grid">
        
        <div className="stat-card">
          <span className="stat-label">Total solved</span>
          <strong className="stat-value">{totalSolved}</strong>
          <small className="stat-note">Across loaded profiles</small>
        </div>

        <div className="stat-card">
          <span className="stat-label">Platforms loaded</span>
          <strong className="stat-value">{stats.filter((item) => item.data).length}/6</strong>
          <small className="stat-note">Live profile data</small>
        </div>

        <section className="content-panel">
          <div className="panel-heading">
            <h3>Current ratings</h3>
            <span>Live data</span>
          </div>
          {stats.map((item) => (
           
            <div className="rating-row" key={item.id}>
              <span>{platforms.find(({ id }) => id === item.id).label}</span>
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