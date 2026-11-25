import { useEffect, useState } from "react";
import { API_URL } from "../api";
import { PLATFORM_IDS } from "../config/platforms";
import { getCachedRequest } from "./requestCache";

export default function useProgress(handles, weeks) {
  const profiles = Object.fromEntries(PLATFORM_IDS.filter(id => handles[id]?.trim())
    .map(id => [id, handles[id].trim()]));
  const body = JSON.stringify({ profiles, weeks });
  const key = "progress:" + new Date().toISOString().slice(0, 10) + ":" + body;
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState({});
  useEffect(() => {
    const refresh = () => setRevision(n => n + 1);
    window.addEventListener("platform-sync", refresh);
    return () => window.removeEventListener("platform-sync", refresh);
  }, []);
  useEffect(() => {
    let current = true;
    const request = getCachedRequest(key, API_URL + "/metrics/progress", {
      fetchOptions: { method: "POST", headers: { "Content-Type": "application/json" }, body },
      shouldCache: result => Object.values(result.platformStatus).every(status => status.ok),
    });
    request.promise.then(data => {
      if (current) setState({ key, revision, data });
    }).catch(error => {
      if (current && error.name !== "AbortError") setState({ key, revision, error });
    });
    return () => { current = false; request.release(); };
  }, [key, body, revision]);
  const ready = state.key === key && revision === state.revision;
  return { data: ready ? state.data : null, error: ready ? state.error : null, loading: !ready,
    retry: () => setRevision(n => n + 1) };
}
