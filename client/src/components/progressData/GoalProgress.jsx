import {useState, useEffect} from "react";

function getLocalDate() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function GoalProgress(){
    const [progress, setProgress] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    

    useEffect(() =>{
        const today = getLocalDate();
        
        fetch(`http://localhost:5000/api/goal/${today}`)
        .then((res) =>{
            if(!res.ok) throw new Error('Error while fetching today CF Stats');
            return res.json();
        })
        .then((json) =>{
            setProgress(json);
            setLoading(false);
        })  
        .catch((e) => {
            setError(e);
            setLoading(false);
            console.error('Unexpected error occured while fetcing the progress');
        })
    }, []);


    if(loading == true){
        return <div>Loading your Progress...</div>
    }  

    if(error != null){
        return <div>Unexpected error occured: {error.message}</div>
    }

    if(!progress){
        return <div>No progress found.</div>
    }

  return(
    <div>
       <h2>Today's Goal Progress</h2>
       <ul>
        {progress.breakdown.map(it => (
           <li key={it.rating}>
           {it.rating} : {it.solved}/{it.required} {it.met ? '✓' : '✗'}
           </li>           
        ))}
       </ul>

       <h2>{progress.allGoalMet ? 'Congrats!! All Goals Met' : 'Oops... Missed goals, keep grinding!'}  </h2>
    </div>
  )

}

export default GoalProgress;