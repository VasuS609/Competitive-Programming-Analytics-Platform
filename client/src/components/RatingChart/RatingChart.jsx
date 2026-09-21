import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function RatingChart({ handle, platform, title }) {
  const [state, setState] = useState({ data: [], loading: Boolean(handle), error: null });

  useEffect(() => {
    if (!handle) {
      return undefined;
    }

    const controller = new AbortController();
    fetch(`${API_URL}/${platform}/rating/${encodeURIComponent(handle.trim())}`, { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json().catch(() => []);
        if (!response.ok) throw new Error(body.error || `Failed to fetch ${platform} rating`);
        return body;
      })
      .then((data) => setState({ data: Array.isArray(data) ? data : [], loading: false, error: null }))
      .catch((error) => {
        if (error.name !== "AbortError") setState({ data: [], loading: false, error });
      });

    return () => controller.abort();
  }, [handle, platform]);

  if (state.loading) return <p>Loading {title} rating...</p>;
  if (state.error) return <p>Could not load {title} rating: {state.error.message}</p>;
  if (!state.data.length) return <p className="muted">Rating history is not available for {title}.</p>;

  return (
    <section className="chart-panel">
      <h3>{title} rating history</h3>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={state.data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="rating" stroke="#e4572e" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </section>
  );
}

export default RatingChart;