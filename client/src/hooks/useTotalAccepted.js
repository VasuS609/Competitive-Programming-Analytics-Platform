import { useEffect, useState } from "react";
import { request } from "../api";

export function useTotalAccepted(handles, days = 7) {
  const [state, setState] = useState({ data: null, error: null, key: "" });
  const [revision, setRevision] = useState(0);
  const profileKey = `${JSON.stringify(handles || {})}:${days}`;

  useEffect(() => {
    const handleSync = () => setRevision((value) => value + 1);
    window.addEventListener("platform-sync", handleSync);
    return () => window.removeEventListener("platform-sync", handleSync);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    request("/graphs/total-accepted", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profiles: handles, days }),
      signal: controller.signal,
    })
      .then((data) => setState({ data, error: null, key: profileKey }))
      .catch((error) => {
        if (error.name !== "AbortError") {
          setState({ data: null, error, key: profileKey });
        }
      });

    return () => controller.abort();
  }, [profileKey, handles, days, revision]);

  return {
    data: state.key === profileKey ? state.data : null,
    error: state.key === profileKey ? state.error : null,
    loading: state.key !== profileKey,
  };
}
