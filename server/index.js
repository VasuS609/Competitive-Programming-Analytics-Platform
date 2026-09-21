const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { getCFStats, fetchRatingHistory } = require('./services/codeforces/cfService');
const {addProblem, getProblemsByDate, getGoalProgress} = require('./services/problemService');
const { getLCStats } = require('./services/leetcode/lcService');
const { getLeetcodeSubmissionCalendar } = require('./services/leetcode/lcSubmissionsCalendar');
const { getCodeChefStats } = require('./services/codechef/codechefService');
const { getCodechefSubmissionCalendar } = require('./services/codechef/ccSubmissionsCalendar');
const { getCodeforcesSubmissionCalendar } = require('./services/codeforces/cfSubmissionsCalendar');


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
app.use(limiter);

app.get('/api/health', (req, res) => {
    res.json({status: 'ok'});
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



const platformServices = {
  codeforces: {
    stats: getCFStats,
    submissions: getCodeforcesSubmissionCalendar,
    rating: async (handle) => fetchRatingHistory(handle),
  },
  codechef: {
    stats: getCodeChefStats,
    submissions: getCodechefSubmissionCalendar,
    rating: async (handle) => {
      const data = await getCodeChefStats(handle);
      return normalizeCodeChefRating(data.ratingData);
    },
  },
  leetcode: {
    stats: getLCStats,
    submissions: getLeetcodeSubmissionCalendar,
    rating: async () => [],
  },
};

function normalizeStats(platform, data, handle) {
  const solved = data.problemSolved ?? data.totalSolved ?? 0;
  const rating = data.rating ?? data.currentRating ?? 0;

  return {
    ...data,
    platform,
    handle: data.handle || data.username || data.name || handle,
    username: data.username || data.name || data.handle || handle,
    solved,
    problemSolved: solved,
    totalSolved: solved,
    rating,
    currentRating: data.currentRating ?? rating,
    rank: data.rank || data.globalRank || null,
    problems: Array.isArray(data.problems) ? data.problems : [],
  };
}

function getPlatformService(platform, type) {
  return platformServices[platform]?.[type];
}

function normalizeCodeChefRating(ratingData) {
  if (!Array.isArray(ratingData)) return [];

  return ratingData.map((item) => ({
    date: item.rating_date || item.date || item.end_date || '',
    rating: Number(item.rating || item.newRating || item.rating_number || 0),
  })).filter((item) => item.date && item.rating);
}

app.get('/api/:platform/stats/:handle', async (req, res) => {
  const platform = req.params.platform.toLowerCase();
  const service = getPlatformService(platform, 'stats');
  if (!service) return res.status(404).json({ error: 'Unsupported platform' });
  if (!req.params.handle) return res.status(400).json({ error: 'Handle is required' });

  try {
    const data = await service(req.params.handle);
    res.json(normalizeStats(platform, data, req.params.handle));
  } catch (error) {
    console.error(error);
    res.status(error.status === 404 ? 404 : 502).json({ error: error.message || 'Failed to fetch stats' });
  }
});

app.get('/api/:platform/submissions/:handle', async (req, res) => {
  const service = getPlatformService(req.params.platform, 'submissions');
  if (!service) return res.status(404).json({ error: 'Unsupported platform' });

  try {
    res.json(await service(req.params.handle));
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: error.message || 'Failed to fetch submissions' });
  }
});

app.get('/api/:platform/rating/:handle', async (req, res) => {
  const service = getPlatformService(req.params.platform, 'rating');
  if (!service) return res.status(404).json({ error: 'Unsupported platform' });

  try {
    res.json(await service(req.params.handle));
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: error.message || 'Failed to fetch rating history' });
  }
});




const port = process.env.PORT || 5000;

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
})
