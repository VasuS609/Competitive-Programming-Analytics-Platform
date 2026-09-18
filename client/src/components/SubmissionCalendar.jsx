import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useSubmissionCalendar } from "../hooks/useSubmissionCalendar";

function SubmissionCalendar({ platform, handle, title }) {
  const { data, loading, error } = useSubmissionCalendar(platform, handle);

  if (loading) return <p>Loading {title} submissions...</p>;
  if (error) return <p>Could not load {title} submissions: {error.message}</p>;
  if (!data) return <p>No {title} submissions found.</p>;

  return (
    <section>
      <h3>{title} submissions, past 7 days</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" fill="#2563eb" />
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
}

export default SubmissionCalendar;