const API_BASE = "https://gfg-stats.tashif.codes";
const { getSolvedProblems } = require("../solvedProblemService");
const { parseCount } = require("../../utils/helpers");
const cache = {};
const CACHE_TTL = 10 * 60 * 1000;

async function fetchGfg(endpoint, handle) {
  const response = await fetch(`${API_BASE}/${encodeURIComponent(handle)}${endpoint}`);
  const body = await response.json().catch(() => ({}));

  if (!response.ok || body.status !== "success") {
    const error = new Error(body.message || `GeeksForGeeks API Error ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return body.data || {};
}

async function getGfgStats(handle) {
  const key = String(handle).trim().toLowerCase();
  const cached = cache[key];
  if (cached && Date.now() < cached.expiresAt) return cached.data;

  const [profile, stats] = await Promise.all([
    fetchGfg("/profile", handle),
    fetchGfg("/stats", handle),
  ]);

  const data = {
    ...profile,
    ...stats,
    username: profile.username || handle,
    problemSolved: parseCount(stats.totalSolved ?? stats.problemSolved ?? stats.solved),
    totalSolved: parseCount(stats.totalSolved ?? stats.problemSolved ?? stats.solved),
    byDifficulty: stats.byDifficulty || {},
    problems: [],
  };

  cache[key] = { data, expiresAt: Date.now() + CACHE_TTL };
  return { ...data, problems: getSolvedProblems("gfg", handle) };
}

async function getGfgSubmissionCalendar(handle, days = 7) {
  const { buildCalendar, getLastNDates, toUTCDateString } = require("../../utils/dates");
  const heatmap = await fetchGfg("/heatmap", handle);
  const dates = getLastNDates(30);
  const counts = Object.fromEntries(dates.map((date) => [date, 0]));
  let firstActivityDate = null;

  for (const entry of heatmap.dailyContributions || []) {
    const dateValue = entry.date || entry.day || entry.timestamp;
    const countValue = entry.count ?? entry.value ?? entry.submissions ?? entry.contributions;
    if (dateValue == null) continue;

    const date = toUTCDateString(
      typeof dateValue === "number" ? dateValue * (dateValue < 1e12 ? 1000 : 1) : dateValue,
    );
    if (!(date in counts)) continue;

    counts[date] = Number(countValue) || 0;
    if (counts[date] > 0 && (!firstActivityDate || date < firstActivityDate)) {
      firstActivityDate = date;
    }
  }

  return buildCalendar(counts, firstActivityDate, days);
}

module.exports = { getGfgStats, getGfgSubmissionCalendar };
