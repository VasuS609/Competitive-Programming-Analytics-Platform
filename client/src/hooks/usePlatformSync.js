import { useState } from "react";
import { syncPlatform as requestPlatformSync } from "../api";

export function usePlatformSync(platform, handle) {
  const [state, setState] = useState({ data: null, error: null, loading: false });

  async function sync() {
    const normalizedHandle = handle?.trim() || "";
    if (!platform || !normalizedHandle) return null;

    setState({ data: null, error: null, loading: true });
    try {
      const data = await requestPlatformSync(platform, normalizedHandle);
      setState({ data, error: null, loading: false });
      return data;
    } catch (error) {
      setState({ data: null, error, loading: false });
      return null;
    }
  }

  return { ...state, sync };
}
