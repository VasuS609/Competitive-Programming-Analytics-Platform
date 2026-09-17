import { useEffect, useState } from "react";


export function useCodechefStats(handle){
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() =>{
        fetch(`http://localhost:5000/api/data/codechef/${handle}`)
        .then((res) => {
            if(!res.ok){
                throw new Error('Error while fetching Codechef stats');
            }
            return res.json();
        })
        .then((data) => {
            setData(data);
            setLoading(false);
        })
        .catch((error) => {
            setError(error.message);
            setLoading(false);
        });
    }, [handle]);

    return { loading, data, error };
}