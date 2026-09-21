import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export function useSubmissionCalendar(handle, platform) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(Boolean(handle));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!handle || !platform) {
      return undefined;
    }

    const controller = new AbortController();

    fetch(`${API_URL}/${platform}/submissions/${encodeURIComponent(handle.trim())}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || `Failed to fetch ${platform} submissions`);
        return body;
      })
      .then(setData)
      .catch((fetchError) => {
        if (fetchError.name !== "AbortError") {
          setError(fetchError);
          setData([]);
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [platform, handle]);

  return { data, loading, error };
}