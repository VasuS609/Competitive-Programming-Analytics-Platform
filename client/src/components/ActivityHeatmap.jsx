import { useMemo, useState } from "react";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const LEVEL_COLORS = [
  "var(--heatmap-level-0)",
  "var(--heatmap-level-1)",
  "var(--heatmap-level-2)",
  "var(--heatmap-level-3)",
  "var(--heatmap-level-4)",
];
const LABELS = { codeforces: "Codeforces", leetcode: "LeetCode", github: "GitHub" };
const UNITS = { github: "commit" };

function unitFor(platform, count) {
  const unit = UNITS[platform] || "submission";
  return `${unit}${count === 1 ? "" : "s"}`;
}

function levelFor(count, max) {
  if (!count || count <= 0) return 0;
  return Math.min(4, Math.max(1, Math.ceil((count / max) * 4)));
}

function formatLong(date) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function buildMonths(daily) {
  const months = [];
  for (const day of daily) {
    const key = day.date.slice(0, 7);
    let month = months[months.length - 1];
    if (!month || month.key !== key) {
      const first = new Date(`${key}-01T00:00:00Z`);
      const daysInMonth = new Date(
        Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0),
      ).getUTCDate();
      month = {
        key,
        title: first.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
          timeZone: "UTC",
        }),
        offset: first.getUTCDay(),
        daysInMonth,
        days: [],
      };
      months.push(month);
    }
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

  return (
    <div className="heatmap">
      <div className="heatmap-head">
        <h3>{months.length} month history</h3>
        <div className="heatmap-legend" aria-hidden="true">
          <span>Fewer events</span>
          <i style={{ background: `linear-gradient(90deg, ${LEVEL_COLORS.join(", ")})` }} />
          <span>More events</span>
        </div>
      </div>
      <div className="heatmap-scroll">
        <div className="heatmap-container">
          <div className="heatmap-weekdays-col" aria-hidden="true">
            <div className="heatmap-weekdays-spacer" />
            <div className="heatmap-weekdays">
              {WEEKDAYS.map((label, index) => (
                <span className="heatmap-weekday" key={index}>{label}</span>
              ))}
            </div>
          </div>
          <div className="heatmap-months">
            {months.map((month) => (
              <div className="heatmap-month" key={month.key}>
                <h4>{month.title}</h4>
                <div className="heatmap-grid">
                  {Array.from({ length: month.offset }, (_, index) => (
                    <span key={`pad-${index}`} className="heatmap-pad" />
                  ))}
                  {Array.from({ length: month.daysInMonth }, (_, index) => {
                    const date = `${month.key}-${String(index + 1).padStart(2, "0")}`;
                    const day = byDate[date];
                    if (!day) return <span className="heatmap-cell future" key={date} />;
                    const level = levelFor(day.total, max);
                    return (
                      <button
                        type="button"
                        key={date}
                        className={`heatmap-cell level-${level}${hovered === date ? " hovered" : ""}`}
                        data-level={level}
                        style={{ background: LEVEL_COLORS[level] }}
                        title={`${day.total} event${day.total === 1 ? "" : "s"} on ${formatLong(date)}`}
                        aria-label={`${day.total} events on ${formatLong(date)}`}
                        onMouseEnter={() => setHovered(date)}
                        onFocus={() => setHovered(date)}
                        onMouseLeave={() => setHovered(null)}
                        onBlur={() => setHovered(null)}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="heat-map-details" aria-live="polite">
        <strong>
          {hoveredDay
            ? `${formatLong(hoveredDay.date)} - ${hoveredDay.total} event${hoveredDay.total === 1 ? "" : "s"}`
            : `${data.totals.total} events on ${data.activeDays} active days`}
        </strong>
        {hoveredDay ? (
          hoveredEntries.length ? (
            hoveredEntries.map(([platform, count]) => (
              <span key={platform}>
                {LABELS[platform]} - {count} {unitFor(platform, count)}
              </span>
            ))
          ) : (
            <span>No activity</span>
          )
        ) : (
          <>
            <span>Current streak - {data.streak.current} {data.streak.current === 1 ? "day" : "days"}</span>
            <span>Longest streak - {data.streak.longest} {data.streak.longest === 1 ? "day" : "days"}</span>
          </>
        )}
      </div>
    </div>
  );
}

export default ActivityHeatmap;
