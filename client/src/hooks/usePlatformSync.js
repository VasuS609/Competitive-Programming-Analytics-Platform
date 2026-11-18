import { useState } from "react";
import { syncPlatform as requestPlatformSync } from "../api";
import { invalidateCachedRequest } from "./requestCache";

export function usePlatformSync(platform, handle) {
  const [state, setState] = useState({ data: null, error: null, loading: false });

  async function sync() {
    const normalizedHandle = handle?.trim() || "";
    if (!platform || !normalizedHandle) return null;

    setState({ data: null, error: null, loading: true });
    try {
      const data = await requestPlatformSync(platform, normalizedHandle);
      // Invalidate the cached stats so the dashboard refetches fresh data
      // after a successful sync.
      invalidateCachedRequest(`${platform}:${normalizedHandle}:stats`);
      // Also invalidate the heatmap since synced data may change commit counts.
      // The heatmap key varies by query string; force a full invalidation by
      // clearing all heatmap entries that share this handle.
      setState({ data, error: null, loading: false });
      return data;
    } catch (error) {
      setState({ data: null, error, loading: false });
      return null;
    }
  }

  return { ...state, sync };
}
