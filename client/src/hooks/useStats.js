import { useEffect, useState } from "react";
import { API_URL } from "../api";
import { getCachedRequest, invalidateCachedRequest } from "./requestCache";
import { PLATFORM_IDS } from "../config/platforms";

export function useStats(handle, platform) {
  const [state, setState] = useState({ data: null, error: null, key: "" });

  const normalizedHandle = handle?.trim() || "";
  const requestKey = `${platform}:${normalizedHandle}`;
  const validRequest = Boolean(normalizedHandle && PLATFORM_IDS.includes(platform));
  const cacheKey = `${platform}:${normalizedHandle}:stats`;

  useEffect(() => {
    if (!validRequest) return undefined;

    const request = getCachedRequest(
      cacheKey,
      `${API_URL}/${platform}/stats/${encodeURIComponent(normalizedHandle)}`,
    );

    request.promise
      .then((data) => setState({ data, error: null, key: requestKey }))
      .catch((error) => {
        if (error.name !== "AbortError") setState({ data: null, error, key: requestKey });
      });

    return request.release;
  }, [normalizedHandle, platform, requestKey, validRequest, cacheKey]);

  return {
    data: state.key === requestKey ? state.data : null,
    loading: validRequest && state.key !== requestKey,
    error: state.key === requestKey ? state.error : null,
    /** Call this after a sync to force a fresh fetch on the next render. */
    invalidate: () => invalidateCachedRequest(cacheKey),
  };
}

export default useStats;
