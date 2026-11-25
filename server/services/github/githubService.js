const { fetchJson } = require("../../utils/httpClient");
const { getLastNDates, toUTCDateString } = require("../../utils/dates");

const API_BASE = "https://api.github.com";

const GITHUB_HEADERS = {
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
};

const { handleKey } = require("../../utils/helpers");
const { createTtlCache } = require("../../utils/ttlCache");
const statsCache = createTtlCache();
const pushCache = createTtlCache();
const MAX_EVENT_PAGES = 3;

async function fetchGithub(path) {
  return fetchJson(`${API_BASE}${path}`, { headers: GITHUB_HEADERS });
}

function getGithubDailyPushes(handle, options) {
  return pushCache.get(handleKey(handle), async () => {
    const counts = {};
    for (let page = 1; page <= MAX_EVENT_PAGES; page += 1) {
      const events = await fetchGithub(
        `/users/${encodeURIComponent(handle)}/events/public?per_page=100&page=${page}`,
      );
      if (!Array.isArray(events)) throw new Error("Invalid GitHub events response");
      for (const event of events) {
        if (event.type !== "PushEvent" || !event.created_at) continue;
        const date = toUTCDateString(event.created_at);
        if (date) counts[date] = (counts[date] || 0) + 1;
      }
      if (events.length < 100) break;
    }
    return counts;
  }, options);
}

async function getGithubData(handle, options) {
  const userPath = `/users/${encodeURIComponent(handle)}`;
  const [profile, repositories, counts] = await Promise.all([
    fetchGithub(userPath),
    fetchGithub(`${userPath}/repos?per_page=100&sort=updated`),
    getGithubDailyPushes(handle, options),
  ]);
  const pushesByDay = Object.fromEntries(getLastNDates(30).map((date) => [date, counts[date] || 0]));
  const totalPushes = Object.values(pushesByDay).reduce((total, count) => total + count, 0);

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
    totalPushes,
    pushesByDay,
    problems: normalizedRepositories,
  };

  return data;
}

function getGithubStats(handle, options) {
  return statsCache.get(handleKey(handle), () => getGithubData(handle, options), options);
}

async function getGithubSubmissionCalendar(handle, days = 7) {
  const counts = await getGithubDailyPushes(handle);
  return getLastNDates(days).map((date) => ({
    date,
    count: counts[date] || 0,
  }));
}

module.exports = { getGithubStats, getGithubSubmissionCalendar, getGithubDailyPushes };
