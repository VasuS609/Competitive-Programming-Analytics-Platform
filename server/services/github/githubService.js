const API_BASE = "https://api.github.com";
const cache = {};
const CACHE_TTL = 10 * 60 * 1000;

async function fetchGithub(path, handle) {
  const response = await fetch(`${API_BASE}${path.replace(":handle", encodeURIComponent(handle))}`, {
    headers: { Accept: "application/vnd.github+json" },
  });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(body.message || `GitHub API Error ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return body;
}

async function getGithubStats(handle) {
  const key = String(handle).trim().toLowerCase();
  const cached = cache[key];
  if (cached && Date.now() < cached.expiresAt) return cached.stats;

  const profile = await fetchGithub("/users/:handle", handle);
  const stats = {
    username: profile.login || handle,
    name: profile.name || profile.login || handle,
    avatar: profile.avatar_url,
    bio: profile.bio,
    followers: profile.followers || 0,
    following: profile.following || 0,
    publicRepos: profile.public_repos || 0,
    totalSolved: profile.public_repos || 0,
    problemSolved: profile.public_repos || 0,
    rating: 0,
    currentRating: 0,
    problems: [],
  };

  cache[key] = { stats, expiresAt: Date.now() + CACHE_TTL };
  return stats;
}

async function getGithubSubmissionCalendar(handle, days = 7) {
  const { buildCalendar, getLastNDates, toUTCDateString } = require("../../utils/dates");
  const events = await fetchGithub("/users/:handle/events/public?per_page=100", handle);
  const dates = getLastNDates(30);
  const counts = Object.fromEntries(dates.map((date) => [date, 0]));
  let firstActivityDate = null;

  for (const event of Array.isArray(events) ? events : []) {
    if (!event.created_at) continue;
    const date = toUTCDateString(event.created_at);
    if (!(date in counts)) continue;
    counts[date] += 1;
    if (!firstActivityDate || date < firstActivityDate) firstActivityDate = date;
  }

  return buildCalendar(counts, firstActivityDate, days);
}

module.exports = { getGithubStats, getGithubSubmissionCalendar };
