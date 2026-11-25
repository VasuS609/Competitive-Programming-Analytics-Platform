const { getLastNDates, safeDay } = require("../utils/dates");
const { getLeetcodeSubmissionCalendar } = require("./leetcode/lcSubmissionsCalendar");
const { fetchSubmissions } = require("./codeforces/cfTotalAccepted");

// createActivity builds the canonical activity response shape:
// { range, totals, daily: [{ date, submissions, acceptedSubmissions?,
//   acceptedProblems?, nonAcceptedSubmissions?, nonAcceptedByTag? }] }
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
    const date = safeDay(submission.creationTimeSeconds);
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

async function getLeetcodeActivity(handle, days = 7) {
  const calendar = await getLeetcodeSubmissionCalendar(handle, days);
  const daily = Object.fromEntries(calendar.map(({ date, count }) => [date, { submissions: count }]));
  return createActivity(days, daily);
}

async function getGithubActivity(handle, days = 7) {
  const { getGithubDailyPushes } = require("./github/githubService");
  const counts = await getGithubDailyPushes(handle);
  const daily = {};
  for (const [date, count] of Object.entries(counts)) {
    if (count > 0) daily[date] = { submissions: count };
  }
  return createActivity(days, daily);
}

module.exports = { getCodeforcesActivity, getLeetcodeActivity, getGithubActivity, createActivity };
