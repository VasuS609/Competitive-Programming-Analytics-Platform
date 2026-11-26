import { useState } from "react";
import { Link } from "react-router-dom";
import { comparison, number, validGoal } from "./format";

function GoalEditor({ name, goal, onSave }) {
  const [draft, setDraft] = useState(null);
  const value = draft ?? String(goal);
  const invalid = !/^\d+$/.test(value) || !validGoal(Number(value));
  
  return <form className="pg-goal" onSubmit={event => {
    event.preventDefault();
    if (!invalid) { onSave(Number(value)); setDraft(null); }
  }}>
    
    <label>Weekly goal <input aria-label={name + " weekly goal"} inputMode="numeric" value={value}
      aria-invalid={invalid} onChange={event => setDraft(event.target.value)}
      onKeyDown={event => { if (event.key === "Escape") setDraft(null); }} /></label>
    {draft !== null && <button disabled={invalid}>Save</button>}
    {invalid && <small role="alert">Enter a positive whole number.</small>}
  </form>;
}

export default function GoalCard({ domain, connected, result, status, loading, error, goal, onSave, rules }) {
  const points = result?.weekly.at(-1)?.points;
  const percent = points == null || !validGoal(goal) ? null : Math.min(100, Math.round(points / goal * 100));
  const partial = connected && result?.coverage && !result.coverage.complete;
  return <article className="stat-card pg-card" style={{ "--track": domain.color }}>
    <header><h2>{domain.name}</h2><span>{domain.source}</span></header>
    {!connected ? <p><Link to="/">Connect your handle</Link></p> : <>
      <p className="pg-value">{loading ? "…" : points == null ? "—" : number(points)} <small>pts this week</small></p>
      <div className="pg-meter" aria-label={domain.name + " weekly goal progress"}>
        <div style={{ width: (percent ?? 0) + "%" }} /></div>
      <p>{percent == null ? (loading ? "Loading points…" : "Goal progress unavailable") : number(percent) + "% of weekly goal"}</p>
      {rules && <p className="pg-comparison">{comparison(points, result?.baselineMedian, rules.calendar)}</p>}
      {(status?.ok === false || error) && <p className="pg-warning">{domain.source}: {status?.error || "Progress unavailable"}</p>}
      {partial && <details className="pg-coverage"><summary title={result.coverage.reason}>
        {result.coverage.reason?.startsWith("No GitHub token") ? "Partial data · No GitHub token" : "Partial data"}</summary>
        <p>{result.coverage.reason}</p></details>}
    </>}
    {validGoal(goal) && <GoalEditor name={domain.name} goal={goal} onSave={onSave} />}
  </article>;
}
