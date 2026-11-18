import { useMemo, useState } from "react";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const LEVEL_COLORS = ["#f7e6d5", "#f2c7a1", "#ee9f66", "#ec7b36", "#e8612c"];
const LABELS = { codeforces: "Codeforces", leetcode: "LeetCode", github: "GitHub" };
const UNITS = { github: "commit" };

function unitFor(platform, count) { const unit = UNITS[platform] || "submission"; return `${unit}${count === 1 ? "" : "s"}`; }
function levelFor(count, max) { if (!count) return -1; return Math.min(4, Math.ceil((count / max) * 4)); }
function formatLong(date) { return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }); }
function buildMonths(daily) {
  const months = [];
  for (const day of daily) {
    const key = day.date.slice(0, 7); let month = months[months.length - 1];
    if (!month || month.key !== key) { const first = new Date(`${key}-01T00:00:00Z`); const daysInMonth = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate(); month = { key, title: first.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" }), offset: first.getUTCDay(), daysInMonth, days: [] }; months.push(month); }
    month.days.push(day);
  }
  return months;
}

function ActivityHeatmap({ data }) {
  const [hovered, setHovered] = useState(null);
  const daily = data.daily;
  const months = useMemo(() => buildMonths(daily), [daily]);
  const max = useMemo(() => Math.max(1, ...daily.map((day) => day.total)), [daily]);
  const byDate = useMemo(() => Object.fromEntries(daily.map((day) => [day.date, day])), [daily]);
  const hoveredDay = hovered ? byDate[hovered] : null;
  const hoveredEntries = hoveredDay ? Object.entries(hoveredDay.platforms) : [];
  return <div className="heatmap">
    <div className="heatmap-head"><h3>{months.length} month history</h3><div className="heatmap-legend" aria-hidden="true"><span>Fewer events</span><i style={{ background: `linear-gradient(90deg, ${LEVEL_COLORS.join(", ")})` }} /><span>More events</span></div></div>
    <div className="heatmap-months">{months.map((month) => <div className="heatmap-month" key={month.key}><h4>{month.title}</h4><div className="heatmap-grid">{WEEKDAYS.map((label, index) => <span className="heatmap-weekday" key={index}>{label}</span>)}{Array.from({ length: month.offset }, (_, index) => <span key={`pad-${index}`} />)}{Array.from({ length: month.daysInMonth }, (_, index) => { const date = `${month.key}-${String(index + 1).padStart(2, "0")}`; const day = byDate[date]; if (!day) return <span className="heatmap-cell future" key={date} />; const level = levelFor(day.total, max); return <button type="button" key={date} className={`heatmap-cell${hovered === date ? " hovered" : ""}`} style={level >= 0 ? { background: LEVEL_COLORS[level] } : undefined} title={`${day.total} event${day.total === 1 ? "" : "s"} on ${formatLong(date)}`} aria-label={`${day.total} events on ${formatLong(date)}`} onMouseEnter={() => setHovered(date)} onFocus={() => setHovered(date)} onMouseLeave={() => setHovered(null)} onBlur={() => setHovered(null)} />; })}</div></div>)}</div>
    <div className="heat-map-details" aria-live="polite"><strong>{hoveredDay ? `${formatLong(hoveredDay.date)} - ${hoveredDay.total} event${hoveredDay.total === 1 ? "" : "s"}` : `${data.totals.total} events on ${data.activeDays} active days`}</strong>{hoveredDay ? (hoveredEntries.length ? hoveredEntries.map(([platform, count]) => <span key={platform}>{LABELS[platform]} - {count} {unitFor(platform, count)}</span>) : <span>No activity</span>) : <><span>Current streak - {data.streak.current} {data.streak.current === 1 ? "day" : "days"}</span><span>Longest streak - {data.streak.longest} {data.streak.longest === 1 ? "day" : "days"}</span></>}</div>
  </div>;
}

export default ActivityHeatmap;
