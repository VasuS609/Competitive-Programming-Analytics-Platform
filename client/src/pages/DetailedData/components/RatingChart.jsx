import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { API_URL } from "../../../api";

function RatingChart({ handle, platform, title }) {
  const [state, setState] = useState({ data: [], error: null, key: "" });
  const requestKey = `${platform}:${handle || ""}`;
  const validRequest = Boolean(handle && platform);

  useEffect(() => {
    if (!validRequest) {
      return undefined;
    }

    const controller = new AbortController();
    fetch(`${API_URL}/${platform}/rating/${encodeURIComponent(handle.trim())}`, { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json().catch(() => []);
        if (!response.ok) throw new Error(body.error || `Failed to fetch ${platform} rating`);
        return body;
      })
      .then((data) => setState({ data: Array.isArray(data) ? data : [], error: null, key: requestKey }))
      .catch((error) => {
        if (error.name !== "AbortError") setState({ data: [], error, key: requestKey });
      });

    return () => controller.abort();
  }, [handle, platform, requestKey, validRequest]);

  const loading = validRequest && state.key !== requestKey;
  const data = state.key === requestKey ? state.data : [];
  const error = state.key === requestKey ? state.error : null;

  if (loading) return <p className="text-sm text-ink/50">Loading {title} rating...</p>;
  if (error) return <p className="text-sm text-red-600">Could not load {title} rating: {error.message}</p>;
  if (!data.length) return <p className="text-sm text-ink/50">Rating history is not available for {title}.</p>;

  return (
    <section className="content-panel chart-panel">
      <h3>{title} rating history</h3>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e0" />
          <XAxis dataKey="date" stroke="#1f1f1f" fontSize={12} />
          <YAxis stroke="#1f1f1f" fontSize={12} />
          <Tooltip />
          <Line type="monotone" dataKey="rating" stroke="#e4572e" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </section>
  );
}

export default RatingChart;