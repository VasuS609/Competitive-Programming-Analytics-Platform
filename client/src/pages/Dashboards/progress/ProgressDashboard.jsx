import { useState } from "react";
import { Link } from "react-router-dom";
import useProgress from "../../../hooks/useProgress";
import GoalCard from "./GoalCard";
import DayGrid from "./DayGrid";
import { WeekCharts, CpExtras } from "./ProgressCharts";
import { domains, validGoal } from "./format";
import "./progress.css";

const storageKey = "dsa-tracker:weekly-goals:v1";
function readGoals() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    return Object.fromEntries(domains.filter(d => validGoal(saved?.[d.id])).map(d => [d.id, saved[d.id]]));
  } catch { return {}; }
}

function CalculationNote({ rules, unknownDifficulty }) {
  if (!rules) return null;
  const { dsa, cp, dev, calendar } = rules;
  return <details className="content-panel pg-note"><summary>How this is calculated</summary>
    <p>Days follow UTC. Weeks run Monday through Sunday. Each domain has its own points and weekly goal.</p>
    <dl><dt>DSA · LeetCode</dt><dd>Each problem counts once, on its first accepted submission seen in the recent history.
      Easy earns {dsa.easy}, Medium {dsa.medium}, Hard {dsa.hard}. Unknown difficulty earns {dsa.unknown}
      {unknownDifficulty != null && ` (${unknownDifficulty} observed in this period)`}. Repeat accepts and failures earn zero.</dd>
    <dt>CP · Codeforces</dt><dd>Each first acceptance earns points relative to your current rating. More than {cp.near} below
      earns {cp.belowPoints}, within ±{cp.near} earns {cp.nearPoints}, above +{cp.near} through +{cp.stretch} earns {cp.stretchPoints},
      and higher earns {cp.abovePoints}. An unrated problem or user earns {cp.unratedPoints}.
      A first practice or virtual acceptance after a contestant attempt also counts as an upsolve.</dd>
    <dt>Dev · GitHub</dt><dd>Commits earn {dev.commit} each, capped at {dev.commitCap} per day across repositories.
      Opened PRs earn {dev.openedPR}, review contributions {dev.review}, and opened issues {dev.issue}.
      Merged PRs are excluded. Daily commit totals can include merge commits. GitHub exposes the latest review contribution per reviewed PR.
      Private activity depends on profile sharing settings and token access. Public push events establish active days only.</dd>
    <dt>Goals and baselines</dt><dd>Goal progress is points divided by the weekly goal, rounded to a percentage and capped at 100%.
      Compare this week so far with the median of the last {calendar.baselineWeeks} full weeks.
      At least {calendar.minimumWeeks} complete weeks are required. Within ±{Math.round(calendar.nearFraction * 100)}% counts as near.</dd>
    <dt>Daily activity</dt><dd>Four positive intensity levels are relative to each row’s highest daily points.
      A submission can mark an active day with zero points. Any activity counts a day once across connected domains.
      Streaks use consecutive UTC days in the selected period. Current ends today. A ≥ value is a confirmed minimum.</dd></dl>
  </details>;
}

export default function ProgressDashboard({ handles }) {
  const [weeks, setWeeks] = useState();
  const [saved, setSaved] = useState(readGoals);
  const { data, loading, error, retry } = useProgress(handles, weeks);
  const goals = { ...data?.rules.goals, ...saved };
  function saveGoal(id, goal) {
    const next = { ...saved, [id]: goal };
    setSaved(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* Keep goals for this visit. */ }
  }
  const connected = domains.some(d => handles[d.platform]);
  const empty = data?.activeDays.length > 0 && data.activeDays.every(day => day.activeDay === false);
  const limits = data?.rules.range;
  return <div className="pg-dashboard" aria-busy={loading}>
    <header className="pg-title"><div><h1>Weekly progress</h1><p>Development, problem solving and contest practice</p></div>
      <label>Period <select aria-label="Progress period" value={weeks ?? data?.range.weeks ?? ""} disabled={!limits}
        onChange={e => setWeeks(Number(e.target.value))}>
        {limits ? Array.from({ length: limits.maxWeeks - limits.minWeeks + 1 }, (_, i) => limits.minWeeks + i)
          .map(n => <option key={n} value={n}>{n} {n === 1 ? "week" : "weeks"}</option>) :
          <option value={weeks ?? ""}>{weeks ? weeks + " weeks" : "Loading…"}</option>}
      </select></label></header>
    {error && <p className="pg-warning" role="alert">Progress unavailable. {error.message} <button onClick={retry}>Retry</button></p>}
    <div className="pg-columns">{domains.map(domain =>
      <GoalCard key={domain.id} domain={domain} connected={Boolean(handles[domain.platform])} loading={loading}
        result={data?.[domain.id]} status={data?.platformStatus[domain.platform]} error={error}
        goal={goals[domain.id]} onSave={goal => saveGoal(domain.id, goal)} rules={data?.rules} />)}</div>
    {empty && connected && <p className="status-panel">No activity in this period. Try a longer period or check your <Link to="/">profile handles</Link>.</p>}
    <DayGrid data={data} loading={loading} />
    <WeekCharts data={data} goals={goals} loading={loading} />
    <CpExtras data={data} loading={loading} />
    <CalculationNote rules={data?.rules} unknownDifficulty={data?.dsa.unknownDifficulty} />
  </div>;
}
