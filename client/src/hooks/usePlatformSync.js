import { useState } from "react";
import { syncPlatform as requestPlatformSync } from "../api";
import { invalidateCachedRequest, invalidateCachedRequestsByPrefix } from "./requestCache";

export function usePlatformSync(platform, handle) {
  const [state, setState] = useState({ data: null, error: null, loading: false });

  async function sync() {
    const normalizedHandle = handle?.trim() || "";
    if (!platform || !normalizedHandle) return null;

    setState({ data: null, error: null, loading: true });
    try {
      const data = await requestPlatformSync(platform, normalizedHandle);
      invalidateCachedRequest(`${platform}:${normalizedHandle}:stats`);
      invalidateCachedRequestsByPrefix("heatmap:");
      invalidateCachedRequestsByPrefix("total-accepted:");
      invalidateCachedRequestsByPrefix(`${platform}:${normalizedHandle}:`);
      window.dispatchEvent(new CustomEvent("platform-sync", {
        detail: { platform, handle: normalizedHandle },
      }));
      setState({ data, error: null, loading: false });
      return data;
    } catch (error) {
      setState({ data: null, error, loading: false });
      return null;
    }
  }

  return { ...state, sync };
}
