import { useState } from "react";
import { request } from "../api";

export function usePlatformSync(platform, handle) {
  const [state, setState] = useState({ data: null, error: null, loading: false });

  async function sync() {
    const normalizedHandle = handle?.trim() || "";
    if (!platform || !normalizedHandle) return null;

    setState({ data: null, error: null, loading: true });
    try {
      const data = await request(
        `/${platform}/sync/${encodeURIComponent(normalizedHandle)}`,
        { method: "POST" },
      );
      setState({ data, error: null, loading: false });
      return data;
    } catch (error) {
      setState({ data: null, error, loading: false });
      throw error;
    }
  }

  return { ...state, sync };
}
