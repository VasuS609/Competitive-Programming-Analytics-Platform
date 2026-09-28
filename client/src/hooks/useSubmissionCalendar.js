import { useEffect, useState } from "react";
import { API_URL } from "../api";
import { getCachedRequest } from "./requestCache";

export function useSubmissionCalendar(handle, platform) {
  const [state, setState] = useState({ data: [], error: null, key: "" });
  const normalizedHandle = handle?.trim() || "";
  const requestKey = `${platform}:${normalizedHandle}`;
  const validRequest = Boolean(normalizedHandle && platform);

  useEffect(() => {
    if (!validRequest) {
      return undefined;
    }

    const request = getCachedRequest(
      `${platform}:${normalizedHandle}:submissions`,
      `${API_URL}/${platform}/submissions/${encodeURIComponent(normalizedHandle)}`,
    );

    request.promise
      .then((data) => setState({ data, error: null, key: requestKey }))
      .catch((fetchError) => {
        if (fetchError.name !== "AbortError") {
          setState({ data: [], error: fetchError, key: requestKey });
        }
      });

    return request.release;
  }, [platform, normalizedHandle, requestKey, validRequest]);

  return {
    data: state.key === requestKey ? state.data : [],
    loading: validRequest && state.key !== requestKey,
    error: state.key === requestKey ? state.error : null,
  };
}