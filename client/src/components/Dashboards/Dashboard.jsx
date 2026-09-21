import { useState } from "react";
import DetailedDashboard from "./DetailedDashboard";
import "../../App.css";
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

    <header className="app-header">
    
    <div>
        <p className="eyebrow">DSA tracker</p>
        <h1>One view for every Platform profile.</h1>
    </div>

      <p className="header-note">Boost your Progress, Rating, and Platform performance in one place.</p>
    </header>

    <form className="handle-form text-black" onSubmit={updateHandles}>

      {platforms.map((
        { id, label }
        ) => <label key={id}>{label}
        <input value={draft[id]} onChange={(event) => setDraft({ ...draft, [id]: event.target.value })} placeholder="username" />
        </label>
     )}
      <button type="submit">Load profiles</button>

    </form>

    <HomeDashboard handles={handles} />

    <nav className="platform-tabs" aria-label="Platform details">

      {platforms.map(({ id, label }) => 
      <button className={selectedPlatform === id ? "active" : ""} 
      key={id} 
      onClick={() => setSelectedPlatform(id)}>{label}</button>)}

    </nav>

    {handles[selectedPlatform] ? 
    <DetailedDashboard handle={handles[selectedPlatform]} platform={selectedPlatform} 
    title={platforms.find(({ id }) => id === selectedPlatform).label} /> : 

    <div className="status-panel">Enter a handle above to open platform details.</div>
    
    }
  </main>)
}


export default Dashboard;
