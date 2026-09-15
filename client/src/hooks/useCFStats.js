import { useState, useEffect } from "react";

export function useCFStats(handle){
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() =>{
        fetch(`http://localhost:5000/api/cf/stats/${handle}`)
        .then((res) => {
            if(!res.ok){
                throw new Error('Error while fetching CF stats');
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
            console.error('Unexpected error occured while fetching Codeforces Stats: ', e);
        })

    }, [handle])

    return {data, loading, error};
}

export default useCFStats;