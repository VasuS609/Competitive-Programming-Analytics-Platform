
import { useState } from "react"


function AddProblemForm(){

    const [formData, setFormData] = useState({
        date : '',
        name : '',
        url : '',
        rating : '',
        source : '',
        tags : ''
    })

    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData(prev => ({...prev, [name]:value}));
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        try{
            const res = await fetch('http://localhost:5000/api/problems', {
                method:'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(formData)
            })

            if(!res.ok) throw new Error('Failed to add the problem');
            console.log('Saved Successfully');
        }catch(e){
            console.log(e);
        }
    }

    return(
        <form onSubmit={handleSubmit}>
            <label >
                Date:
                <input type="text" 
                name = "date"
                value={formData.date}
                onChange={handleChange}
                />
            </label>
            <label >
                name:
                <input type="text" 
                name = "name"
                value={formData.name}
                onChange={handleChange}
                />
            </label>
            <label >
                URL:
                <input type="text" 
                name = "url"
                value={formData.url}
                onChange={handleChange}
                />
            </label>
            <label >
                Rating:
                <input type="text" 
                name = "rating"
                value={formData.rating}
                onChange={handleChange}
                />
            </label>
            <label >
                Source:
                <input type="text" 
                name = "source"
                value={formData.source}
                onChange={handleChange}
                />
            </label>
            <label >
                Tags:
                <input type="text" 
                name = "tags"
                value={formData.tags}
                onChange={handleChange}
                />
            </label>
            <button type="submit">Add Problem</button>
        </form>
    )
}

export default AddProblemForm;