import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useSubmissionCalendar } from "../../../hooks/useSubmissionCalendar";

function SubmissionCalendar({ handle, platform, title }) {
  const { data, loading, error } = useSubmissionCalendar(handle, platform);

  if (loading) return <p className="text-sm text-ink/50">Loading {title} submissions...</p>;
  if (error) return <p className="text-sm text-red-600">Could not load {title} submissions: {error.message}</p>;
  if (!data.length) return <p className="text-sm text-ink/50">No {title} submissions found.</p>;

  return (
    <section className="content-panel chart-panel">
      <h3>{title} Accepted, past 7 days</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e0" />
          <XAxis dataKey="date" stroke="#1f1f1f" fontSize={12} />
          <YAxis allowDecimals={false} stroke="#1f1f1f" fontSize={12} />
          <Tooltip />
          <Bar dataKey="count" fill="#e4572e" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
}

export default SubmissionCalendar;