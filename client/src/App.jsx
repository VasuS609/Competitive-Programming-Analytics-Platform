import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import DetailedDashboard from "./components/pages/DetailedDashboard";
import useStats from "./hooks/platformStats/useStats";
import { useSubmissionCalendar } from "./hooks/submissions/useSubmissionCalendar";
import "./App.css";

const platforms = [
  { id: "codeforces", label: "Codeforces" },
  { id: "codechef", label: "CodeChef" },
  { id: "leetcode", label: "LeetCode" },
];

function App() {
  const [handles, setHandles] = useState({ codeforces: "", codechef: "", leetcode: "" });
  const [draft, setDraft] = useState(handles);
  const [selectedPlatform, setSelectedPlatform] = useState("codeforces");

  const updateHandles = (event) => {
    event.preventDefault();
    setHandles(Object.fromEntries(Object.entries(draft).map(([platform, handle]) => [platform, handle.trim()])));
  };

  return <main className="app-shell">
    <header className="app-header">
      <div><p className="eyebrow">DSA tracker</p><h1>One view for every contest profile.</h1></div>
      <p className="header-note">Compare your solving rhythm, rating, and platform progress in one place.</p>
    </header>
    <form className="handle-form" onSubmit={updateHandles}>
      {platforms.map(({ id, label }) => <label key={id}>{label}<input value={draft[id]} onChange={(event) => setDraft({ ...draft, [id]: event.target.value })} placeholder="username" /></label>)}
      <button type="submit">Load profiles</button>
    </form>
    <HomeDashboard handles={handles} />
    <nav className="platform-tabs" aria-label="Platform details">
      {platforms.map(({ id, label }) => <button className={selectedPlatform === id ? "active" : ""} key={id} onClick={() => setSelectedPlatform(id)}>{label}</button>)}
    </nav>
    {handles[selectedPlatform] ? <DetailedDashboard handle={handles[selectedPlatform]} platform={selectedPlatform} title={platforms.find(({ id }) => id === selectedPlatform).label} /> : <div className="status-panel">Enter a handle above to open platform details.</div>}
  </main>;
}

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
  const calendars = [
    { id: "codeforces", ...codeforcesCalendar },
    { id: "codechef", ...codechefCalendar },
    { id: "leetcode", ...leetcodeCalendar },
  ];
  const activity = useMemo(() => {
    const dates = calendars.find(({ data }) => data.length)?.data.map(({ date }) => date) || [];
    return dates.map((date, index) => ({ date, submissions: calendars.reduce((total, calendar) => total + (calendar.data[index]?.count || 0), 0) }));
  }, [calendars]);
  const totalSolved = stats.reduce((total, item) => total + (item.data?.problemSolved ?? item.data?.totalSolved ?? 0), 0);

  return <section className="home-dashboard">
    <div className="summary-row"><div><span>Total solved</span><strong>{totalSolved}</strong><small>Across loaded profiles</small></div><div><span>Platforms loaded</span><strong>{stats.filter((item) => item.data).length}/3</strong><small>Live profile data</small></div></div>
    <div className="home-grid">
      <section className="chart-panel"><h3>Questions solved, past 7 days</h3>{activity.length ? <ResponsiveContainer width="100%" height={240}><BarChart data={activity}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="submissions" fill="#e4572e" /></BarChart></ResponsiveContainer> : <p className="muted">Load at least one profile to see activity.</p>}</section>
      <section className="rating-summary"><h3>Current ratings</h3>{stats.map((item) => <div className="rating-row" key={item.id}><span>{platforms.find(({ id }) => id === item.id).label}</span><strong>{item.loading ? "..." : item.data?.rating ?? item.data?.currentRating ?? "Unavailable"}</strong></div>)}</section>
    </div>
  </section>;
}

export default App;
