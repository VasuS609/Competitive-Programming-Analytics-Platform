import { useEffect, useState} from "react";


export function useLeetcodeStats({handle}){
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);

    useEffect(()=>{
        fetch(`http://localhost:5000/api/leetcode/stats/${handle}`)
        .then((res) =>{
            if(!res.ok) throw new Error('Error while fetching Leetcode Stats');
            return res.json();
        })
        .then((json)=>{
            setData(json);
            setLoading(false);
        })
        .catch((e)=>{
            setError(e);
            setLoading(false);
            console.error('Unexpected error occcured while fetching Leetcode Stats:', e);
        })
    }, [handle])

    return{data, loading, error};
}

export default useLeetcodeStats;