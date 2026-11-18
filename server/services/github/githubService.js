// NOTE: GitHub's public Events API only exposes the last ~300 events across
// up to 10 pages (100 per page). Private commits are NOT visible via this API
// and are therefore NOT counted here.
const { fetchJson } = require("../../utils/httpClient");
const { getLastNDates, toUTCDateString } = require("../../utils/dates");

const API_BASE = "https://api.github.com";
const GITHUB_HEADERS = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
};

const cache = {};
const CACHE_TTL = 10 * 60 * 1000;
// GitHub Events API caps at 10 pages × 100 events = 300 events (30 days).
const MAX_EVENT_PAGES = 10;
const EVENTS_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

async function fetchGithub(path) {
  return fetchJson(`${API_BASE}${path}`, { headers: GITHUB_HEADERS });
}

function emptyDailyActivity() {
  return Object.fromEntries(getLastNDates(30).map((date) => [date, 0]));
}

function pushCommitCount(event) {
  const payload = event.payload || {};
  const count = payload.distinct_size ?? payload.size ?? payload.commits?.length;
  return Number.isFinite(Number(count)) ? Number(count) : 1;
}

async function getGithubData(handle, { forceRefresh = false } = {}) {
  const key = String(handle).trim().toLowerCase();
  const cached = cache[key];
  if (!forceRefresh && cached && Date.now() < cached.expiresAt) return cached.data;

  const cutoff = Date.now() - EVENTS_WINDOW_MS;

  // Fetch profile and repos in parallel, then paginate events sequentially.
  const [profile, repositories] = await Promise.all([
    fetchGithub(`/users/${encodeURIComponent(handle)}`),
    fetchGithub(`/users/${encodeURIComponent(handle)}/repos?per_page=100&sort=updated`),
  ]);

  const commitsByDay = emptyDailyActivity();
  let totalCommits = 0;
  let allEvents = [];

  for (let page = 1; page <= MAX_EVENT_PAGES; page += 1) {
    const events = await fetchGithub(
      `/users/${encodeURIComponent(handle)}/events/public?per_page=100&page=${page}`,
    );
    if (!Array.isArray(events) || !events.length) break;

    // Stop early if we have gone past the 30-day window.
    const oldest = events[events.length - 1];
    const oldestMs = oldest?.created_at ? Date.parse(oldest.created_at) : 0;
    allEvents = allEvents.concat(events);
    if (oldestMs > 0 && oldestMs < cutoff) break;
    if (events.length < 100) break;
  }

  for (const event of allEvents) {
    if (!event.created_at) continue;
    if (Date.parse(event.created_at) < cutoff) continue;
    const date = toUTCDateString(event.created_at);
    if (!(date in commitsByDay)) continue;
    if (event.type !== "PushEvent") continue;
    const commits = pushCommitCount(event);
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
    recentActivity: allEvents,
    problems: normalizedRepositories,
  };

  cache[key] = { data, expiresAt: Date.now() + CACHE_TTL };
  return data;
}

async function getGithubStats(handle, opts = {}) {
  return getGithubData(handle, opts);
}

async function getGithubSubmissionCalendar(handle, days = 7) {
  const stats = await getGithubData(handle);
  return getLastNDates(days).map((date) => ({
    date,
    count: stats.commitsByDay[date] || 0,
  }));
}

const dailyCommitCache = {};
async function getGithubDailyCommits(handle, { forceRefresh = false } = {}) {
  const key = String(handle).trim().toLowerCase();
  const cached = dailyCommitCache[key];
  if (!forceRefresh && cached && Date.now() < cached.expiresAt) return cached.counts;

  const stats = await getGithubData(handle, { forceRefresh });
  const counts = { ...stats.commitsByDay };
  dailyCommitCache[key] = { counts, expiresAt: Date.now() + CACHE_TTL };
  return counts;
}

module.exports = { getGithubStats, getGithubSubmissionCalendar, getGithubDailyCommits };
