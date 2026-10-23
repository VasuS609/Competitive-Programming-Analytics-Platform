import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { usePlatformActivity } from "../../../hooks/usePlatformActivity";

function SubmissionCalendar({ handle, platform, title, days = 7 }) {
  const { data: activity, loading, error } = usePlatformActivity(handle, platform, days);
  const data = (activity?.daily || []).map((row) => ({
    ...row,
    accepted: row.accepted ?? row.acceptedSubmissions ?? 0,
    nonAccepted: row.nonAccepted ?? Math.max(0, (row.submissions || 0) - (row.acceptedSubmissions || row.accepted || 0)),
  }));

  if (loading) return <p className="text-sm text-ink/50">Loading {title} activity...</p>;
  if (error) return <p className="text-sm text-red-600">Could not load {title} submissions: {error.message}</p>;
  if (!data.length) return <p className="text-sm text-ink/50">No {title} submissions found.</p>;

  return (
    <section className="content-panel chart-panel">
      <h3>{title} activity, past {days} days</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e0" />
          <XAxis dataKey="date" stroke="#1f1f1f" fontSize={12} />
          <YAxis allowDecimals={false} stroke="#1f1f1f" fontSize={12} />
          <Tooltip />
          <Bar dataKey="submissions" name="Submissions" fill="#2f80ed" radius={[4, 4, 0, 0]} />
          <Bar dataKey="accepted" name="Accepted" fill="#899e20" radius={[4, 4, 0, 0]} />
          <Bar dataKey="nonAccepted" name="Non-accepted" fill="#e4572e" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
}

export default SubmissionCalendar;