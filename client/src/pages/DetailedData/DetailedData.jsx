import { Link, NavLink } from "react-router-dom";
import DetailedDashboard from "./DetailedDashboard";
import { useProfile } from "../../context/useProfile";

const platforms = [
  { id: "codeforces", label: "Codeforces" },
  { id: "codechef", label: "CodeChef" },
  { id: "leetcode", label: "LeetCode" },
];

function DetailedData() {
  const { activePlatform, handles, setActivePlatform } = useProfile();
  const platform = platforms.find(({ id }) => id === activePlatform);
  const handle = handles[activePlatform];

  return (
    <main className="app-shell text-black">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">DS</span>
          <span>Competitive Programming and DSA Tracker</span>
        </div>
        <nav className="app-navigation" aria-label="Primary navigation">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
            Home
          </NavLink>
          <NavLink to="/detailed" className={({ isActive }) => (isActive ? "active" : "")}>
            Detailed data
          </NavLink>
        </nav>
      </header>

      <section className="hero">
        <p className="eyebrow">Detailed progress</p>
        <h1>Profile data, one platform at a time.</h1>
        <p className="hero-copy">Review ratings, recent submissions, and solved problems for your selected profile.</p>
      </section>

      <nav className="platform-tabs" aria-label="Platform details">
        {platforms.map(({ id, label }) => (
          <button
            key={id}
            className={`tab-button ${activePlatform === id ? "active" : ""}`}
            onClick={() => setActivePlatform(id)}
            type="button"
          >
            {label}
          </button>
        ))}
      </nav>

      {handle ? (
        <DetailedDashboard
          handle={handle}
          platform={activePlatform}
          title={platform.label}
        />
      ) : (
        <div className="status-panel">
          Add your username on <Link to="/">Home</Link> to view {platform.label} details.
        </div>
      )}
    </main>
  );
}

export default DetailedData;
