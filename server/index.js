const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const run = require('./services/cfService');

const {fetchRatingHistory} = require('./services/cfService');
const {addProblem, getProblemsByDate, getGoalProgress} = require('./services/problemService');
const { getLCStats } = require('./services/lcService');
const { getCodeChefStats } = require('./services/codechefService');


const { default: rateLimit } = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
})

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.get('/api/health', (req, res) => {
    res.json({status: 'ok'});
})

app.get('/api/cf/stats/:handle', async (req, res) => {
 //todo: call getCFStatus(req.param.handle) send as JSON;
    try{
        const data = await run(req.params.handle);
        res.json(data);
    }catch(e){
        console.error(e);
        res.status(500).json({
            error:'Failed to fetch CF stats'
        });
    }
})


app.post('/api/problems', (req, res) => {
  try {
    const {date, name, url, rating, source, tags} = req.body || {};

    if (!date || !name || !url || !rating || !source || !tags) {
      
      return res.status(400).json({
        message: 'date, name, url, rating, source and tags are required'
      });
    }

    addProblem({date, name, url, rating, source, tags});
    res.status(201).json({
      message: 'success',
      data: {date, name, url, rating, source, tags}
    });
  }
  catch(e) {
    console.error(e);

    res.status(500).json({
        message: "Unexpected error occured",
        error: e.message
    })
  }
});


app.get('/api/problems/:date', (req, res) => {
  // 1. call getProblemsByDate(req.params.date)

  try{
    const data = getProblemsByDate(req.params.date);
    // 2. send it back as JSON
    res.json(data);
  }catch(e){
    res.status(500).json({
        message: "Unexpected error occured",
        error: e.message
    })
  }

  // 3. try/catch, 500 on failure
});


app.get('/api/goal/:date', (req, res) =>{
  try{
    const progress = getGoalProgress(req.params.date);
    res.json(progress);
  }catch(e){
    console.error(e);
    res.status(500).json({error: "Failed to get the progress"});
  }
})


app.get('/api/cf/rating/:handle', async(req, res) => {
  try{
    const history = await fetchRatingHistory(req.params.handle);
    res.json(history);
  }catch(e){
    console.log(e);
    res.status(500).json({
      error:'Failed to fetch rating history'
    });
  }
})

app.get('/api/leetcode/stats/:handle', async(req, res) => {
  try{
    const data = await  getLCStats(req.params.handle);
    res.json(data);
  }catch(e){
    console.log(e);
    res.status(501).json({
      error: 'Failed to fetch rating history'
    })
  }
})

const port = process.env.PORT || 5000;

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
})


app.get('/api/data/codechef/:handle', async (req, res) => {
  const { handle } = req.params;

  if (!handle) {
    return res.status(400).json({ error: 'CodeChef handle is required' });
  }

  try {
    const data = await getCodeChefStats(handle);
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status( 502 ).json({
      error: e.message || 'Failed to fetch CodeChef data'
    });
  }
});