const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { default: rateLimit } = require('express-rate-limit');

// Services & Aggregators
const { addProblem, getProblemsByDate, getGoalProgress } = require('./services/goals/problemService');
const getPlatformService = require('./getPlatformServices');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware Config

// Global Rate Limiting (60 requests per minute)
const limiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  message: { error: 'Too many requests, please try again later.' }
});

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(limiter);

// Helper & Utility Functions

// Validates and constrains submission day range (1 to 30 days).
 
function parseSubmissionDays(value) {
  if (value === undefined) return 7;

  const days = Number(value);
  if (!Number.isInteger(days) || days <= 0) return 7;

  return Math.min(30, Math.max(1, days));
}

/**
 * Normalizes user statistics across different platform schema responses.
 */

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

// 
// Health Check Route

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Problem Tracker & Goal Routes

app.post('/api/problems', (req, res, next) => {
  try {
    const { date, name, url, rating, source, tags } = req.body || {};

    // Basic payload presence check
    if (!date || !name || !url || !rating || !source || !tags) {
      return res.status(400).json({
        error: 'Missing required fields: date, name, url, rating, source, and tags are required.'
      });
    }

    const newProblem = { date, name, url, rating, source, tags };
    addProblem(newProblem);

    return res.status(201).json({
      message: 'Problem added successfully',
      data: newProblem
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/problems/:date', (req, res, next) => {
  try {
    const data = getProblemsByDate(req.params.date);
    return res.json(data);
  } catch (error) {
    next(error);
  }
});

app.get('/api/goal/:date', (req, res, next) => {
  try {
    const progress = getGoalProgress(req.params.date);
    return res.json(progress);
  } catch (error) {
    next(error);
  }
});

// Dynamic Platform Integration Routes

// Platform User Stats
app.get('/api/:platform/stats/:handle', async (req, res, next) => {
  const platform = req.params.platform.toLowerCase();
  const { handle } = req.params;

  if (!handle) {
    return res.status(400).json({ error: 'User handle is required' });
  }

  const service = getPlatformService(platform, 'stats');
  if (!service) {
    return res.status(404).json({ error: `Platform '${platform}' is not supported` });
  }

  try {
    const data = await service(handle);
    return res.json(normalizeStats(platform, data, handle));
  } catch (error) {
    next({ status: error.status || 502, message: error.message || 'Failed to fetch platform stats' });
  }
});

// Platform Submission History
app.get('/api/:platform/submissions/:handle', async (req, res, next) => {
  const platform = req.params.platform.toLowerCase();
  const { handle } = req.params;

  const service = getPlatformService(platform, 'submissions');
  if (!service) {
    return res.status(404).json({ error: `Platform '${platform}' is not supported` });
  }

  try {
    const days = parseSubmissionDays(req.query.days);
    const submissions = await service(handle, days);
    return res.json(submissions);
  } catch (error) {
    next({ status: 502, message: error.message || 'Failed to fetch submission history' });
  }
});

// Platform Rating History
app.get('/api/:platform/rating/:handle', async (req, res, next) => {
  const platform = req.params.platform.toLowerCase();
  const { handle } = req.params;

  const service = getPlatformService(platform, 'rating');
  if (!service) {
    return res.status(404).json({ error: `Platform '${platform}' is not supported` });
  }

  try {
    const ratingData = await service(handle);
    return res.json(ratingData);
  } catch (error) {
    next({ status: 502, message: error.message || 'Failed to fetch rating history' });
  }
});

// Fallback & Error Handling Middleware

// 404 Handler for Undefined Routes
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Centralized Express Error Handler
app.use((err, req, res, next) => {
  console.error('[Error]', err);

  const status = err.status || 500;
  const message = err.message || 'An unexpected internal server error occurred';

  res.status(status).json({ error: message });
});

// Server Initialization

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});