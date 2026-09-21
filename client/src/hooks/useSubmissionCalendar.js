import { useEffect, useState } from "react";
import { API_URL } from "../api";

export function useSubmissionCalendar(handle, platform) {
  const [state, setState] = useState({ data: [], error: null, key: "" });
  const requestKey = `${platform}:${handle || ""}`;
  const validRequest = Boolean(handle && platform);

  useEffect(() => {
    if (!validRequest) {
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
      .then((data) => setState({ data, error: null, key: requestKey }))
      .catch((fetchError) => {
        if (fetchError.name !== "AbortError") {
          setState({ data: [], error: fetchError, key: requestKey });
        }
      });

    return () => controller.abort();
  }, [platform, handle, requestKey, validRequest]);

  return {
    data: state.key === requestKey ? state.data : [],
    loading: validRequest && state.key !== requestKey,
    error: state.key === requestKey ? state.error : null,
  };
}