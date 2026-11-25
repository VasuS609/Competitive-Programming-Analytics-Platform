import { useEffect, useState } from "react";
import { API_URL } from "../api";

export function usePlatformActivity(handle, platform, days = 7) {
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState({ data: null, error: null, key: "" });
  const normalizedHandle = handle?.trim() || "";
  const key = `${platform}:${normalizedHandle}:${days}`;

  useEffect(() => {
    if (!normalizedHandle) return undefined;
    const controller = new AbortController();
    const handleSync = ({ detail }) => {
      if (detail?.platform === platform && detail?.handle === normalizedHandle) {
        setRevision((value) => value + 1);
      }
    };
    window.addEventListener("platform-sync", handleSync);

    fetch(`${API_URL}/${platform}/activity/${encodeURIComponent(normalizedHandle)}?days=${days}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || "Failed to fetch activity");
        return body;
      })
      .then((data) => setState({ data, error: null, key }))
      .catch((error) => {
        if (error.name !== "AbortError") setState({ data: null, error, key });
      });

    return () => {
      controller.abort();
      window.removeEventListener("platform-sync", handleSync);
    };
  }, [key, normalizedHandle, platform, days, revision]);

  return {
    data: state.key === key ? state.data : null,
    error: state.key === key ? state.error : null,
    loading: state.key !== key,
  };
}
