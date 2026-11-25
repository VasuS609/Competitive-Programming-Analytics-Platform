import { Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { domains, number, shortDate } from "./format";

const tick = { fill: "#43534a", fontSize: 11 };
function WeekTooltip({ active, payload, label, domain }) {
  if (!active || !payload?.length) return null;
  const week = payload[0].payload;
  return <div className="pg-tooltip"><strong>Week of {label}</strong><p>{number(week.points)} pts</p>
    <p>Active days · {number(week.activeDays)}</p>
    {domain === "dev" && <p>Repositories · {number(week.repositories)}</p>}</div>;
}

export function WeekCharts({ data, goals, loading }) {
  return <section className="pg-weekly"><h2>Weekly points</h2>
    <div className="pg-columns">{domains.map(domain => {
      const weeks = data?.[domain.id].weekly ?? [];
      const goal = goals[domain.id];
      return <article className="content-panel" key={domain.id}>
        <header className="pg-heading"><h3>{domain.name}</h3><span>Goal · {number(goal)} pts</span></header>
        <div className="pg-plot">{weeks.some(w => w.points != null) ?
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeks} margin={{ top: 12, right: 8, bottom: 2, left: 0 }}>
              <CartesianGrid stroke="#dce2dd" vertical={false} />
              <XAxis dataKey="week" tickFormatter={shortDate} tick={tick} minTickGap={12} />
              <YAxis width={40} tick={tick} domain={[0, max => Math.max(max, goal || 0)]} />
              <Tooltip content={<WeekTooltip domain={domain.id} />} />
              <ReferenceLine y={goal} stroke="#43534a" strokeDasharray="5 3" />
              <Bar dataKey="points" name={domain.name + " points"} fill={domain.color} radius={[3,3,0,0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer> : <p>{loading ? "Loading weeks…" : "Weekly points unavailable"}</p>}</div>
      </article>;
    })}</div>
  </section>;
}

export function CpExtras({ data, loading }) {
  const trend = data?.cp.ratingTrend;
  const month = data?.cp.contests?.find(row => row.month === data.range.to.slice(0, 7));
  return <section className="content-panel pg-extras"><div>
    <h2>Codeforces contests</h2><dl>
      <div><dt>Upsolves in period</dt><dd>{loading ? "…" : number(data?.cp.upsolved)}</dd></div>
      <div><dt>Rated contests this month</dt><dd>{loading ? "…" : number(month?.count)}</dd></div>
    </dl></div><div><h3>Rating trend {data && "· last " + data.rules.calendar.ratingMonths + " months"}</h3>
    <div className="pg-plot">{trend?.length ?
      <ResponsiveContainer width="100%" height="100%"><LineChart data={trend} margin={{ top: 8, left: 0, right: 12 }}>
        <CartesianGrid stroke="#dce2dd" vertical={false} />
        <XAxis dataKey="date" tickFormatter={shortDate} tick={tick} minTickGap={20} />
        <YAxis width={48} tick={tick} allowDecimals={false} domain={["auto","auto"]} />
        <Tooltip formatter={v => [number(v), "Rating"]} />
        <Line dataKey="rating" stroke="#395d91" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
      </LineChart></ResponsiveContainer> : <p>{loading ? "Loading rating history…" : trend ? "No rated contests in this period." : "Rating history unavailable"}</p>}</div>
    </div></section>;
}
