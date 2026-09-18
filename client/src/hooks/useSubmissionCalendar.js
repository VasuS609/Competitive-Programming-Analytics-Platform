import { useEffect, useState } from "react";

export function useSubmissionCalendar(platform, handle) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(`http://localhost:5000/api/${platform}/submissions/${handle}`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error(`Failed to fetch ${platform} submissions`);
        return response.json();
      })
      .then(setData)
      .catch((fetchError) => {
        if (fetchError.name !== "AbortError") setError(fetchError);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [platform, handle]);

  return { data, loading, error };
}