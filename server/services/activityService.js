const { getLastNDates, toUTCDateString } = require("../utils/dates");
const { getCodeChefStats } = require("./codechef/codechefService");
const { getLCStats } = require("./leetcode/lcService");
const { fetchSubmissions } = require("./codeforces/cfTotalAccepted");

function createActivity(days, daily, acceptedAvailable = false) {
  const dates = getLastNDates(days);
  const rows = dates.map((date) => ({
    date,
    submissions: daily[date]?.submissions || 0,
    acceptedSubmissions: acceptedAvailable ? daily[date]?.acceptedSubmissions || 0 : null,
    acceptedProblems: acceptedAvailable ? new Set(daily[date]?.acceptedProblemIds || []).size : null,
    nonAcceptedSubmissions: acceptedAvailable ? daily[date]?.nonAcceptedSubmissions || 0 : null,
    nonAcceptedByTag: acceptedAvailable ? daily[date]?.nonAcceptedByTag || {} : null,
  }));
  const acceptedProblemIds = rows.flatMap((row) => daily[row.date]?.acceptedProblemIds || []);

  return {
    range: { days, from: dates[0], to: dates[dates.length - 1] },
    totals: {
      submissions: rows.reduce((sum, row) => sum + row.submissions, 0),
      acceptedSubmissions: acceptedAvailable ? rows.reduce((sum, row) => sum + row.acceptedSubmissions, 0) : null,
      acceptedProblems: acceptedAvailable ? new Set(acceptedProblemIds).size : null,
      nonAcceptedSubmissions: acceptedAvailable ? rows.reduce((sum, row) => sum + row.nonAcceptedSubmissions, 0) : null,
    },
    daily: rows,
  };
}

async function getCodeforcesActivity(handle, days = 7) {
  const submissions = await fetchSubmissions(handle);
  const daily = {};
  submissions.forEach((submission) => {
    if (!submission.problem || !submission.creationTimeSeconds) return;
    const date = toUTCDateString(submission.creationTimeSeconds * 1000);
    if (!date) return;
    if (!daily[date]) {
      daily[date] = {
        submissions: 0,
        acceptedSubmissions: 0,
        acceptedProblemIds: [],
        nonAcceptedSubmissions: 0,
        nonAcceptedByTag: {},
      };
    }
    daily[date].submissions += 1;
    if (submission.verdict === "OK") {
      daily[date].acceptedSubmissions += 1;
      daily[date].acceptedProblemIds.push(`${submission.problem.contestId}:${submission.problem.index}`);
    } else {
      daily[date].nonAcceptedSubmissions += 1;
      for (const tag of submission.problem.tags || []) {
        daily[date].nonAcceptedByTag[tag] = (daily[date].nonAcceptedByTag[tag] || 0) + 1;
      }
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
