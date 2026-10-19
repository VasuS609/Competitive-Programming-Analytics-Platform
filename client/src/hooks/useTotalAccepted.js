import { useEffect, useState } from "react";
import { request } from "../api";

export function useTotalAccepted(handles) {
  const [state, setState] = useState({ data: null, error: null, key: "" });
  const profileKey = JSON.stringify(handles || {});

  useEffect(() => {
    const controller = new AbortController();

    request("/graphs/total-accepted", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profiles: handles }),
      signal: controller.signal,
    })
      .then((data) => setState({ data, error: null, key: profileKey }))
      .catch((error) => {
        if (error.name !== "AbortError") {
          setState({ data: null, error, key: profileKey });
        }
      });

    return () => controller.abort();
  }, [profileKey, handles]);

  return {
    data: state.key === profileKey ? state.data : null,
    error: state.key === profileKey ? state.error : null,
    loading: state.key !== profileKey,
  };
}
