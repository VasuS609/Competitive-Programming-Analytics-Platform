import { useEffect, useState } from "react";
import { API_URL } from "../api";
import { getCachedRequest, invalidateCachedRequest } from "./requestCache";
import { PLATFORM_IDS } from "../config/platforms";

export function useStats(handle, platform) {
  const [state, setState] = useState({ data: null, error: null, key: "" });
  const [revision, setRevision] = useState(0);

  const normalizedHandle = handle?.trim() || "";
  const requestKey = `${platform}:${normalizedHandle}`;
  const validRequest = Boolean(normalizedHandle && PLATFORM_IDS.includes(platform));
  const cacheKey = `${platform}:${normalizedHandle}:stats`;

  useEffect(() => {
    if (!validRequest) return undefined;

    const handleSync = (event) => {
      if (event.detail?.platform !== platform || event.detail?.handle !== normalizedHandle) return;
      invalidateCachedRequest(cacheKey);
      setRevision((value) => value + 1);
    };
    window.addEventListener("platform-sync", handleSync);

    const request = getCachedRequest(
      cacheKey,
      `${API_URL}/${platform}/stats/${encodeURIComponent(normalizedHandle)}`,
    );

    request.promise
      .then((data) => setState({ data, error: null, key: requestKey }))
      .catch((error) => {
        if (error.name !== "AbortError") setState({ data: null, error, key: requestKey });
      });

    return () => {
      window.removeEventListener("platform-sync", handleSync);
      request.release();
    };
  }, [normalizedHandle, platform, requestKey, validRequest, cacheKey, revision]);

  return {
    data: state.key === requestKey ? state.data : null,
    loading: validRequest && state.key !== requestKey,
    error: state.key === requestKey ? state.error : null,
    /** Call this after a sync to force a fresh fetch on the next render. */
    invalidate: () => invalidateCachedRequest(cacheKey),
  };
}

export default useStats;
