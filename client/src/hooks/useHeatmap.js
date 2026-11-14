import { useEffect, useState } from "react";
import { API_URL } from "../api";
import { getCachedRequest } from "./requestCache";

const PLATFORMS = ["codeforces", "codechef", "atcoder", "leetcode", "gfg", "github"];

export function useHeatmap(handles, months = 3) {
  const [state, setState] = useState({ data: null, error: null, key: "" });
  const params = new URLSearchParams({ months: String(months) });
  PLATFORMS.forEach((platform) => { const handle = handles?.[platform]?.trim(); if (handle) params.set(platform, handle); });
  const query = params.toString();
  const validRequest = PLATFORMS.some((platform) => params.has(platform));

  useEffect(() => {
    if (!validRequest) return undefined;
    const request = getCachedRequest(`heatmap:${query}`, `${API_URL}/heatmap?${query}`);
    request.promise.then((data) => setState({ data, error: null, key: query })).catch((error) => {
      if (error.name !== "AbortError") setState({ data: null, error, key: query });
    });
    return request.release;
  }, [query, validRequest]);

  return { data: state.key === query ? state.data : null, error: state.key === query ? state.error : null, loading: validRequest && state.key !== query, hasHandles: validRequest };
}

export default useHeatmap;
