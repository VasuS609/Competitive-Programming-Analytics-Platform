import { useState } from "react";
import HomeDashboard from "./HomeDashboard";
import { NavLink } from "react-router-dom";
import { useProfile } from "../../context/useProfile";

const platforms = [
  { id: "codeforces", label: "Codeforces" },
  { id: "codechef", label: "CodeChef" },
  { id: "leetcode", label: "LeetCode" },
];

function ProfileForm({ activePlatform, handles, setActivePlatform, setHandle }) {
  const [draft, setDraft] = useState(handles[activePlatform]);
  const platform = platforms.find(({ id }) => id === activePlatform);

  const saveHandle = (event) => {
    event.preventDefault();
    setHandle(activePlatform, draft);
  };

  return (
    <form className="handle-form" onSubmit={saveHandle}>
      <label className="field-label">
        Platform
        <select
          value={activePlatform}
          onChange={(event) => setActivePlatform(event.target.value)}
        >
          {platforms.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
        </select>
      </label>
      <label className="field-label">
        Username
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={`${platform.label} username`}
          maxLength={40}
        />
      </label>
      <button type="submit" className="primary-button">Save</button>
    </form>
  );
}

function Dashboard() {
  const { activePlatform, handles, setActivePlatform, setHandle } = useProfile();
  const hasHandles = Object.values(handles).some(Boolean);

  return (
    <main className="app-shell text-black">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">DS</span>
          <span>Competitive Programming and DSA Tracker</span></div>
          <nav className="app-navigation" aria-label="Primary navigation">
        <NavLink
          to="/"
          className={({ isActive }) => (isActive ? "active" : "")}
          end
        >
          Home
        </NavLink>
        <NavLink
          to="/detailed"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          Detailed data
        </NavLink>
      </nav>
        <p className="topbar-note font-medium text-black">Your practice progress and patience, in one clear view.</p>
      </header>

      <section className="hero">
        <p className="eyebrow ">Daily practice dashboard</p>
        <h1>One view for every platform profile.</h1>
        <p className="hero-copy">Track solved problems, ratings, and recent activity without jumping between tabs.</p>
      </section>

      <ProfileForm
        key={activePlatform}
        activePlatform={activePlatform}
        handles={handles}
        setActivePlatform={setActivePlatform}
        setHandle={setHandle}
      />

      {hasHandles ? (
        <HomeDashboard handles={handles} />
      ) : (
        <div className="status-panel text-center mt-8">
          Save a username above to populate your dashboard.
        </div>
      )}
    </main>
  );
}

export default Dashboard;


/*

    <>
      
    </>
*/