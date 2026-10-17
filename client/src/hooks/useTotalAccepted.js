import { useEffect, useState } from "react";
import { request } from "../api";

export function useTotalAccepted(handles) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const profileKey = JSON.stringify(handles || {});

  useEffect(() => {
    const controller = new AbortController();
    setState({ data: null, error: null, loading: true });

    request("/graphs/total-accepted", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profiles: handles }),
      signal: controller.signal,
    })
      .then((data) => setState({ data, error: null, loading: false }))
      .catch((error) => {
        if (error.name !== "AbortError") {
          setState({ data: null, error, loading: false });
        }
      });

    return () => controller.abort();
  }, [profileKey, handles]);

  return state;
}
