const { getLastNDates, toUTCDateString } = require("../../utils/dates");

const API_BASE = "https://api.github.com";
const cache = {};
const CACHE_TTL = 10 * 60 * 1000;

async function fetchGithub(path) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.message || `GitHub API Error ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return body;
}

function emptyDailyActivity() {
  return Object.fromEntries(getLastNDates(30).map((date) => [date, 0]));
}

async function getGithubData(handle) {
  const key = String(handle).trim().toLowerCase();
  const cached = cache[key];
  if (cached && Date.now() < cached.expiresAt) return cached.data;

  const [profile, repositories, events] = await Promise.all([
    fetchGithub(`/users/${encodeURIComponent(handle)}`),
    fetchGithub(`/users/${encodeURIComponent(handle)}/repos?per_page=100&sort=updated`),
    fetchGithub(`/users/${encodeURIComponent(handle)}/events/public?per_page=100`),
  ]);

  const commitsByDay = emptyDailyActivity();
  let totalCommits = 0;
  for (const event of Array.isArray(events) ? events : []) {
    if (!event.created_at) continue;
    const date = toUTCDateString(event.created_at);
    if (!(date in commitsByDay)) continue;
    const commits = event.type === "PushEvent"
      ? Number(event.payload?.distinct_size ?? event.payload?.size ?? 0)
      : 0;
    commitsByDay[date] += commits;
    totalCommits += commits;
  }

  const normalizedRepositories = (Array.isArray(repositories) ? repositories : []).map((repo) => ({
    id: repo.id,
    name: repo.full_name || repo.name,
    url: repo.html_url,
    description: repo.description,
    language: repo.language || "Unknown",
    stars: repo.stargazers_count || 0,
    forks: repo.forks_count || 0,
    updatedAt: repo.updated_at,
  }));

  const data = {
    username: profile.login || handle,
    handle: profile.login || handle,
    name: profile.name || profile.login || handle,
    avatar: profile.avatar_url,
    bio: profile.bio,
    followers: profile.followers || 0,
    following: profile.following || 0,
    publicRepos: profile.public_repos || normalizedRepositories.length,
    totalSolved: 0,
    problemSolved: 0,
    rating: 0,
    currentRating: 0,
    repositories: normalizedRepositories,
    totalCommits,
    commitsByDay,
    recentActivity: Array.isArray(events) ? events : [],
    problems: normalizedRepositories,
  };

  cache[key] = { data, expiresAt: Date.now() + CACHE_TTL };
  return data;
}

async function getGithubStats(handle) {
  return getGithubData(handle);
}

async function getGithubSubmissionCalendar(handle, days = 7) {
  const stats = await getGithubData(handle);
  return getLastNDates(days).map((date) => ({
    date,
    count: stats.commitsByDay[date] || 0,
  }));
}

module.exports = { getGithubStats, getGithubSubmissionCalendar };
