import { useEffect, useState } from "react";
import { API_URL } from "../api";
import { getCachedRequest, invalidateCachedRequestsByPrefix } from "./requestCache";
import { PLATFORM_IDS } from "../config/platforms";

export function useHeatmap(handles, months = 3) {
  const [state, setState] = useState({ data: null, error: null, key: "" });
  const [revision, setRevision] = useState(0);
  const params = new URLSearchParams({ months: String(months) });
  PLATFORM_IDS.forEach((platform) => {
    const handle = handles?.[platform]?.trim();
    if (handle) params.set(platform, handle);
  });
  const query = params.toString();
  const validRequest = PLATFORM_IDS.some((platform) => params.has(platform));

  useEffect(() => {
    if (!validRequest) return undefined;

    const handleSync = () => {
      invalidateCachedRequestsByPrefix("heatmap:");
      setState((prev) => ({ ...prev, key: "" }));
      setRevision((value) => value + 1);
    };
    window.addEventListener("platform-sync", handleSync);
    const request = getCachedRequest(`heatmap:${query}`, `${API_URL}/heatmap?${query}`);
    request.promise
      .then((data) => setState({ data, error: null, key: query }))
      .catch((error) => {
        if (error.name !== "AbortError") setState({ data: null, error, key: query });
      });
    return () => {
      window.removeEventListener("platform-sync", handleSync);
      request.release();
    };
  }, [query, validRequest, revision]);

  return {
    data: state.key === query ? state.data : null,
    error: state.key === query ? state.error : null,
    loading: validRequest && state.key !== query,
    hasHandles: validRequest,
  };
}

export default useHeatmap;
