import { useEffect, useState } from "react";
import { API_URL } from "../api";
import { getCachedRequest } from "./requestCache";

export function useSubmissionCalendar(handle, platform, days = 7) {
  const [state, setState] = useState({ data: [], error: null, key: "" });
  const [revision, setRevision] = useState(0);
  const normalizedHandle = handle?.trim() || "";

  useEffect(() => {
    const handleSync = (event) => {
      if (event.detail?.platform !== platform || event.detail?.handle !== normalizedHandle) return;
      setRevision((value) => value + 1);
    };
    window.addEventListener("platform-sync", handleSync);
    return () => window.removeEventListener("platform-sync", handleSync);
  }, [platform, normalizedHandle]);

  const requestKey = `${platform}:${normalizedHandle}:${days}`;
  const validRequest = Boolean(normalizedHandle && platform);

  useEffect(() => {
    if (!validRequest) {
      return undefined;
    }

    const request = getCachedRequest(
      `${platform}:${normalizedHandle}:submissions?days=${days}`,
      `${API_URL}/${platform}/submissions/${encodeURIComponent(normalizedHandle)}?days=${days}`,
    );

    request.promise
      .then((data) => setState({ data, error: null, key: requestKey }))
      .catch((fetchError) => {
        if (fetchError.name !== "AbortError") {
          setState({ data: [], error: fetchError, key: requestKey });
        }
      });

    return request.release;
    
  }, [platform, normalizedHandle, days, requestKey, validRequest, revision]);

  return {
    data: state.key === requestKey ? state.data : [],
    loading: validRequest && state.key !== requestKey,
    error: state.key === requestKey ? state.error : null,
  };
}