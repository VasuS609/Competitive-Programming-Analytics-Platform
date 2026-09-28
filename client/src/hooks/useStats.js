import { useEffect, useState } from "react";
import { API_URL } from "../api";
import { getCachedRequest } from "./requestCache";
const PLATFORMS = ["codeforces", "codechef", "leetcode"];

export function useStats(handle, platform) {
    const [state, setState] = useState({ data: null, error: null, key: "" });
    const normalizedHandle = handle?.trim() || "";
    const requestKey = `${platform}:${normalizedHandle}`;
    const validRequest = Boolean(normalizedHandle && PLATFORMS.includes(platform));

    useEffect(() => {
        if (!validRequest) {
            return undefined;
        }

        const request = getCachedRequest(
            `${platform}:${normalizedHandle}:stats`,
            `${API_URL}/${platform}/stats/${encodeURIComponent(normalizedHandle)}`,
        );

        request.promise
            .then((data) => setState({ data, error: null, key: requestKey }))
            .catch((error) => {
                if (error.name !== "AbortError") setState({ data: null, error, key: requestKey });
            });

        return request.release;
    }, [normalizedHandle, platform, requestKey, validRequest]);

    return {
        data: state.key === requestKey ? state.data : null,
        loading: validRequest && state.key !== requestKey,
        error: state.key === requestKey ? state.error : null,
    };
}

export default useStats;