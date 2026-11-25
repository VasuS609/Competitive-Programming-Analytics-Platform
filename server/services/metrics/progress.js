const { getLCStats } = require("../leetcode/lcService");
const { getCFStats } = require("../codeforces/cfService");
const { fetchSubmissions } = require("../codeforces/cfTotalAccepted");
const { fetchRatingHistory } = require("../codeforces/cfRating");
const { getGithubContributions } = require("../github/githubContributions");
const { getGithubDailyPushes } = require("../github/githubService");
const { toUTCDateString } = require("../../utils/dates");
const rules = require("./config");
const { monday, baselineMedian, activeDays } = require("./weekly");
const { cpScore } = require("./cpScore");
const { devScore } = require("./devScore");
const { dsaScore } = require("./dsaScore");

function weekRange(weeks, to) {
  const start = new Date(monday(to) + "T00:00:00Z");
  start.setUTCDate(start.getUTCDate() - (weeks - 1) * rules.calendar.daysPerWeek);
  return { from: toUTCDateString(start), to };
}

async function leetcode(handle) {
  const stats = await getLCStats(handle);
  if (!stats.recentSubmissionsAvailable) throw new Error("Recent submissions unavailable");
  return range => dsaScore(stats.recentSubmissions, range);
}

async function codeforces(handle, _historyRange, status) {
  // Rating history controls the contest extras. Its failure does not invalidate
  // first solves weighted against the separately fetched current rating.
  const historyRequest = fetchRatingHistory(handle).catch(() => {
    status.codeforces = { ok: false, error: "Codeforces rated contest history unavailable" };
    return null;
  });
  const [submissions, stats, history] = await Promise.all([
    fetchSubmissions(handle), getCFStats(handle), historyRequest,
  ]);
  return range => cpScore(submissions, stats.rating, history, { ...range, complete: true });
}

async function github(handle, historyRange, status) {
  let reason = "No GitHub token configured / limited to about the last 90 days";
  if (process.env.GITHUB_TOKEN?.trim()) {
    try {
      const { rows, complete, reason: limitation } = await getGithubContributions(handle, historyRange);
      return range => devScore(rows, { ...range, complete, reason: limitation });
    } catch {
      reason = "GitHub contributions unavailable / public push activity limited to about the last 90 days";
      status.github = { ok: false, error: "GitHub contributions unavailable" };
    }
  }
  let days = [];
  try {
    days = Object.keys(await getGithubDailyPushes(handle));
  } catch {
    status.github = { ok: false, error: "GitHub public events unavailable" };
    reason += ". Public events are also unavailable.";
  }
  return range => devScore(null, { ...range, complete: false, reason }, days);
}

async function getProgress(handles, weeks, { now = new Date(), providers = { leetcode, codeforces, github } } = {}) {
  const to = toUTCDateString(now);
  const range = weekRange(weeks, to);
  const historyRange = weekRange(Math.max(weeks, rules.calendar.baselineWeeks + 1), to);
  const platformStatus = {};

  async function track(platform, unavailable) {
    const handle = handles[platform];
    if (handle) {
      try {
        const score = await providers[platform](handle, historyRange, platformStatus);
        const result = score(range);
        const history = range.from === historyRange.from ? result : score(historyRange);
        result.baselineMedian = baselineMedian(history.weekly, to);
        platformStatus[platform] ??= { ok: true };
        return result;
      } catch {
        platformStatus[platform] = { ok: false, error: platform + " activity is unavailable" };
      }
    }
    const result = unavailable();
    result.coverage.reason = handle ? platformStatus[platform].error : "Connect your handle";
    result.baselineMedian = null;
    return result;
  }

  const [dsa, cp, dev] = await Promise.all([
    track("leetcode", () => dsaScore(null, range)),
    track("codeforces", () => cpScore(null, null, null, range)),
    track("github", () => devScore(null, range)),
  ]);
  const connected = [[handles.leetcode, dsa], [handles.codeforces, cp], [handles.github, dev]]
    .filter(([handle]) => handle).map(([, domain]) => domain.daily);
  return { range: { ...range, weeks }, dsa, cp, dev,
    activeDays: activeDays(...(connected.length ? connected : [dsa.daily])), platformStatus, rules };
}

module.exports = { getProgress };
