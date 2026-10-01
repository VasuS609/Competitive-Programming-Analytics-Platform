//I have taken ai help to understand and write these logics and code though i know what i am doing :)

const db = require('../../db');

function addProblem({date, name, url, rating, source, tags}) {  
    const stmt = db.prepare(`
        INSERT INTO problem (date, name, url, rating, source, tags)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(date, name, url, rating, source, tags);
}


function getProblemsByDate(date){
    const stmt = db.prepare('SELECT * FROM problem WHERE date = ?');
    return stmt.all(date);
}


function getGoalProgress(date){
    const activeGoals = db.prepare('SELECT * FROM goals WHERE active = 1').all();

    const countstmt = db.prepare('SELECT COUNT(*) as count FROM problem WHERE date = ? AND rating = ?');

    const breakdown = activeGoals.map( goal =>{
            const result = countstmt.all(date, goal.rating)[0];

            return{
                rating: goal.rating,
                required: goal.count_required,
                solved: result.count,
                met: result.count >= goal.count_required
            }
    });

    const allGoalMet = breakdown.every(g => g.met);

    return {date, breakdown, allGoalMet};
}


module.exports = {
    addProblem
    ,getProblemsByDate
    ,getGoalProgress
};