import { useState } from "react";
import DetailedDashboard from "./DetailedDashboard";
import HomeDashboard from "./HomeDashboard";

//header, form -> tabs -> home dashboard -> detailed dashboard

const platforms = [
  { id: "codeforces", label: "Codeforces" },
  { id: "codechef", label: "CodeChef" },
  { id: "leetcode", label: "LeetCode" },
];

function Dashboard() {
  const [handles, setHandles] = useState({ codeforces: "", codechef: "", leetcode: "" });
  const [draft, setDraft] = useState(handles);
  const [selectedPlatform, setSelectedPlatform] = useState("codeforces");

  const updateHandles = (event) => {
    event.preventDefault();
    setHandles(Object.fromEntries(Object.entries(draft).map(([platform, handle]) => [platform, handle.trim()])));
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">DS</span><span>Competitive Programming and DSA Tracker</span></div>
        <p className="topbar-note font-medium text-black">Your practice progress and patience, in one clear view.</p>
      </header>

      <section className="hero">
        <p className="eyebrow">Daily practice dashboard</p>
        <h1>One view for every platform profile.</h1>
        <p className="hero-copy">Track solved problems, ratings, and recent activity without jumping between tabs.</p>
      </section>

      <form
        className="handle-form"
        onSubmit={updateHandles}
      >
        {platforms.map(({ id, label }) => (
          <label key={id} className="field-label">
            {label}
            <input
              value={draft[id]}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  [id]: event.target.value,
                }))
              }
              placeholder="username"
            />
          </label>
        ))}
        <button
          type="submit"
          className="primary-button"
        >
          Load profiles
        </button>
      </form>

      <HomeDashboard handles={handles} />

      <nav className="platform-tabs" aria-label="Platform details">

      {platforms.map(({ id, label }) => (
        <button
          key={id}
          className={`tab-button ${
            selectedPlatform === id
              ? "active"
              : ""
          }`}
          onClick={() => setSelectedPlatform(id)}
        >
          {label}
        </button>
      ))}

    </nav>

      {handles[selectedPlatform] ?
      <DetailedDashboard handle={handles[selectedPlatform]} platform={selectedPlatform}
      title={platforms.find(({ id }) => id === selectedPlatform).label} /> :

      <div className="status-panel">Enter a handle above to open platform details.</div>

      }
    </main>
  );
}


export default Dashboard;