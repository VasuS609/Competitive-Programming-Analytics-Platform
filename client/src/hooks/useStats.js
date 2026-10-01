import { useEffect, useState } from "react";
import { API_URL } from "../api";
import { getCachedRequest } from "./requestCache";
const PLATFORMS = ["codeforces", "codechef", "leetcode"];

export function useStats(handle, platform) {
    const [state, setState] = useState({ data: null, error: null, key: "" });

    const normalizedHandle = handle?.trim() || ""; //cleaning up white spaces
    const requestKey = `${platform}:${normalizedHandle}`; //unique id eg leetcode:vaxh
    const validRequest = Boolean(normalizedHandle && PLATFORMS.includes(platform)); //if platform exist and handle exists

    useEffect(() => {

        if (!validRequest) {
            return undefined;
        }

        const request = getCachedRequest( //checking already in cache?
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