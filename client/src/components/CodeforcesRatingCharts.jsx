import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';


function RatingCharts({handle}){
    const [rating,setRating] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() =>{
        fetch(`http://localhost:5000/api/cf/rating/${handle}`)
        .then((res) =>{
            if(!res.ok) throw new Error('Error while fetching ratings');
            return res.json();
        })
        .then((json) => {
            setRating(json);
            setLoading(false);
        })
        .catch((e) => {
            setError(e);
            setLoading(false);
            console.error('Unexpected Error while fetchign the rating')
        })
    }, [handle])

    if(loading == true){
        return <div>Loading your progress...</div>
    }
    if(error != null){
        return <div>Unexpected error occured while fetching your ratings {error.message}</div>
    }
    if(!rating){
        return <div>No rating Found!</div>
    }

    return(
        <div>
            <ResponsiveContainer width="100%" height={300}>
            <LineChart data={rating}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="rating" stroke="#8884d8" />
            </LineChart>
            </ResponsiveContainer>
        </div>
    )
}

export default RatingCharts;