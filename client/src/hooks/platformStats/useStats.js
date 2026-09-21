import { useEffect, useState } from "react";
import { API_URL } from "../../api";
const PLATFORMS = ["codeforces", "codechef", "leetcode"];

export function useStats(handle, platform) {
    const [state, setState] = useState({ data: null, loading: Boolean(handle), error: null });

    useEffect(() => {
        if (!handle || !PLATFORMS.includes(platform)) {
            return undefined;
        }

        const controller = new AbortController();

        fetch(`${API_URL}/${platform}/stats/${encodeURIComponent(handle.trim())}`, { signal: controller.signal })
            .then(async (response) => {
                const body = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(body.error || `Failed to fetch ${platform} stats`);
                return body;
            })
            .then((data) => setState({ data, loading: false, error: null }))
            .catch((error) => {
                if (error.name !== "AbortError") setState({ data: null, loading: false, error });
            });

        return () => controller.abort();
    }, [handle, platform]);

    return state;
}

export default useStats;