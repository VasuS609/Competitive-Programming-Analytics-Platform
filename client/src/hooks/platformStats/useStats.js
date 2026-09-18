import { useState, useEffect } from "react";

export function useStats(handle, platform){
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() =>{
        fetch(`http://localhost:5000/api/${platform}/stats/${handle}`)
        .then((res) => {
            if(!res.ok){
                throw new Error(`Error while fetching ${platform} stats`);
            }
            return res.json();
        })
        .then((json) => {
            setData(json);
            setLoading(false);
        })
        .catch((e) => {
            setError(e);
            setLoading(false);
            console.error(`Unexpected error occured while fetching ${platform} Stats: `, e);
        })

    }, [handle, platform])

    return {data, loading, error};
}

export default useStats;