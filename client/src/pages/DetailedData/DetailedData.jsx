import { useState } from "react";
import { Link } from "react-router-dom";
import DetailedDashboard from "./DetailedDashboard";

const platforms = [
  { id: "codeforces", label: "Codeforces" },
  { id: "codechef", label: "CodeChef" },
  { id: "leetcode", label: "LeetCode" },
];

const defaultHandles = {
  codeforces: "",
  codechef: "",
  leetcode: "",
};

function readHandles() {
  try {
    const saved = localStorage.getItem("cp_tracker_handles");
    if (!saved) return defaultHandles;

    const parsed = JSON.parse(saved);
    if (!parsed || typeof parsed !== "object") return defaultHandles;

    const handles = { ...defaultHandles };
    for (const platform of platforms) {
      if (typeof parsed[platform.id] !== "string") return defaultHandles;
      handles[platform.id] = parsed[platform.id].trim();
    }
    return handles;
  } catch {
    return defaultHandles;
  }
}

function DetailedData() {
  const [handles] = useState(readHandles);
  const [selectedPlatform, setSelectedPlatform] = useState("codeforces");
  const platform = platforms.find(({ id }) => id === selectedPlatform);
  const handle = handles[selectedPlatform];

  return (
    <main className="app-shell text-black">
      <section className="hero">
        <p className="eyebrow">Detailed progress</p>
        <h1>Profile data, one platform at a time.</h1>
        <p className="hero-copy">Review ratings, recent submissions, and solved problems for your selected profile.</p>
      </section>

      <nav className="platform-tabs" aria-label="Platform details">
        {platforms.map(({ id, label }) => (
          <button
            key={id}
            className={`tab-button ${selectedPlatform === id ? "active" : ""}`}
            onClick={() => setSelectedPlatform(id)}
            type="button"
          >
            {label}
          </button>
        ))}
      </nav>

      {handle ? (
        <DetailedDashboard
          handle={handle}
          platform={selectedPlatform}
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
