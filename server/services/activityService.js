const { getLastNDates, toUTCDateString } = require("../utils/dates");
const { getCodeChefStats } = require("./codechef/codechefService");
const { getLCStats } = require("./leetcode/lcService");

function createActivity(days, daily, acceptedAvailable = false) {
  const dates = getLastNDates(days);
  const acceptedProblemIds = Object.values(daily).flatMap((entry) => entry.acceptedProblemIds || []);
  const rows = dates.map((date) => ({
    date,
    submissions: daily[date]?.submissions || 0,
    acceptedSubmissions: acceptedAvailable ? daily[date]?.acceptedSubmissions || 0 : null,
    acceptedProblems: acceptedAvailable ? new Set(daily[date]?.acceptedProblemIds || []).size : null,
  }));

  return {
    range: { days, from: dates[0], to: dates[dates.length - 1] },
    totals: {
      submissions: rows.reduce((sum, row) => sum + row.submissions, 0),
      acceptedSubmissions: acceptedAvailable ? rows.reduce((sum, row) => sum + row.acceptedSubmissions, 0) : null,
      acceptedProblems: acceptedAvailable ? new Set(acceptedProblemIds).size : null,
    },
    daily: rows,
  };
}

async function getCodeforcesActivity(handle, days = 7) {
  const response = await fetch(`https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}`);
  if (!response.ok) throw new Error(`Codeforces API Error ${response.status}`);

  const body = await response.json();
  const daily = {};
  (body.result || []).forEach((submission) => {
    if (!submission.problem || !submission.creationTimeSeconds) return;
    const date = toUTCDateString(submission.creationTimeSeconds * 1000);
    if (!daily[date]) daily[date] = { submissions: 0, acceptedSubmissions: 0, acceptedProblemIds: [] };
    daily[date].submissions += 1;
    if (submission.verdict === "OK") {
      daily[date].acceptedSubmissions += 1;
      daily[date].acceptedProblemIds.push(`${submission.problem.contestId}:${submission.problem.index}`);
    }
  });

  return createActivity(days, daily, true);
}

async function getCodeChefActivity(handle, days = 7) {
  const stats = await getCodeChefStats(handle);
  const daily = {};
  const entries = Array.isArray(stats.heatMap) ? stats.heatMap : Object.entries(stats.heatMap || {});
  entries.forEach((entry) => {
    const [date, count] = Array.isArray(entry) ? entry : [entry.date, entry.value];
    daily[toUTCDateString(date)] = { submissions: Number(count) || 0 };
  });
  return createActivity(days, daily);
}

async function getLeetcodeActivity(handle, days = 7) {
  const stats = await getLCStats(handle);
  const calendar = typeof stats.submissionCalendar === "string" ? JSON.parse(stats.submissionCalendar || "{}") : stats.submissionCalendar || {};
  const daily = {};
  Object.entries(calendar).forEach(([timestamp, count]) => {
    daily[toUTCDateString(Number(timestamp) * 1000)] = { submissions: Number(count) || 0 };
  });
  return createActivity(days, daily);
}

module.exports = { getCodeforcesActivity, getCodeChefActivity, getLeetcodeActivity };
