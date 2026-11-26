import { useState } from "react";
import { domains, number, shortDate, streaks } from "./format";

function description(name, day, combined) {
  const activity = day.activeDay == null ? "Activity unknown" : day.activeDay ? "Active" : "Inactive";
  const fields = [["solved", "solved"], ["commit", "commits"], ["openedPR", "PRs opened"], ["review", "reviews"], ["issue", "issues"]];
  
  const details = fields.filter(([key]) => Number.isFinite(day[key])).map(([key, label]) => number(day[key]) + " " + label);
 
  if (!combined) details.unshift(day.points == null ? "Points unavailable" : number(day.points) + " pts");
  return [day.date, name, activity, ...details].join(" · ");
}

export default function DayGrid({ data, loading, notice }) {
  const [selected, setSelected] = useState(null);
  const dates = data?.activeDays ?? [];
  const runs = streaks(dates);
  const rows = [...domains.map(d => ({ name: d.name, days: data?.[d.id].daily ?? [] })),
    { name: "Any activity", days: dates, combined: true }];
  
    const selectedDay = rows.find(r => r.name === selected?.name)?.days.find(d => d.date === selected?.date);
  return <section className="content-panel pg-days">

    <header className="pg-heading">
      <h2>Active days</h2>
      <span>{data && shortDate(data.range.from) + " – " + shortDate(data.range.to)}</span>
      </header>
    <div className="pg-scroll" aria-label="Daily activity by domain">

      {rows.map(({ name, days, combined }) => {
        const peak = Math.max(1, ...days.map(day => day.points ?? 0));
        return <div className={"pg-row" + (combined ? " pg-any" : "")} key={name}><b>{name}</b>
          {days.map(day => {
            const unknown = day.activeDay == null;
            const level = combined ? Number(day.activeDay) * 4 : Math.ceil((day.points ?? 0) / peak * 4);
            const label = description(name, day, combined);
            const select = () => setSelected({ name, date: day.date });
            return <button key={day.date} type="button" className={`pg-day pg-level-${level}`}
              data-unknown={unknown} data-active={day.activeDay === true} title={label} aria-label={label}
              onFocus={select} onClick={select} onMouseEnter={select}
              onKeyDown={e => {
                if (e.key === "ArrowRight") e.currentTarget.nextElementSibling?.focus();
                if (e.key === "ArrowLeft") e.currentTarget.previousElementSibling?.focus();
              }}>{unknown ? "?" : day.activeDay ? "•" : ""}</button>;
          })}</div>;
      })}
    </div>
    
    <p className="pg-inspect">{selectedDay ? description(selected.name, selectedDay, selected.name === "Any activity") :
      notice ?? (loading ? "Loading daily activity…" : "Select a day for details. A dot marks activity. ? means unknown.")}</p>
    <p className="pg-streaks"><strong>Current streak</strong> {runs.current} <strong>Longest streak</strong> {runs.longest} <span>days in this period</span></p>
  </section>;
}
