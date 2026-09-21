import { useEffect, useState } from "react";
import { API_URL } from "../api";
const PLATFORMS = ["codeforces", "codechef", "leetcode"];

export function useStats(handle, platform) {
    const [state, setState] = useState({ data: null, error: null, key: "" });
    const requestKey = `${platform}:${handle || ""}`;
    const validRequest = Boolean(handle && PLATFORMS.includes(platform));

    useEffect(() => {
        if (!validRequest) {
            return undefined;
        }

        const controller = new AbortController();

        fetch(`${API_URL}/${platform}/stats/${encodeURIComponent(handle.trim())}`, { signal: controller.signal })
            .then(async (response) => {
                const body = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(body.error || `Failed to fetch ${platform} stats`);
                return body;
            })
            .then((data) => setState({ data, error: null, key: requestKey }))
            .catch((error) => {
                if (error.name !== "AbortError") setState({ data: null, error, key: requestKey });
            });

        return () => controller.abort();
    }, [handle, platform, requestKey, validRequest]);

    return {
        data: state.key === requestKey ? state.data : null,
        loading: validRequest && state.key !== requestKey,
        error: state.key === requestKey ? state.error : null,
    };
}

export default useStats;