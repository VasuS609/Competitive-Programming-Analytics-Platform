const router = require("express").Router();
const { getCFAcceptedActivity } = require("../services/codeforces/cfTotalAccepted");
const { getCFNotAcceptedActivity } = require("../services/codeforces/cfNotAccepted");
const { getLCAcceptedActivity } = require("../services/leetcode/lcTotalAccepted");
const { getLastNDates, toUTCDateString } = require("../utils/dates");

// getTotalAcceptedActivity merges per-platform accepted/non-accepted counts
// into a single daily array for the bar chart in HomeDashboard.
// Response shape: { daily: [{ date, submissions, accepted, nonAccepted }] }
async function getTotalAcceptedActivity(profiles, days) {
  const dates = getLastNDates(days);
  const byDate = Object.fromEntries(
    dates.map((date) => [date, { date, submissions: 0, accepted: 0, nonAccepted: 0 }]),
  );

  function merge(rows) {
    for (const row of rows) {
      if (!byDate[row.date]) continue;
      byDate[row.date].submissions += (row.submissions || 0);
      byDate[row.date].accepted += (row.accepted || 0);
      byDate[row.date].nonAccepted += (row.nonAccepted || 0);
    }
  }

  const tasks = [];

  if (profiles?.codeforces?.trim()) {
    const handle = profiles.codeforces.trim();
    tasks.push(
      getCFAcceptedActivity(handle, days).then(merge).catch(() => {}),
      getCFNotAcceptedActivity(handle, days).then(merge).catch(() => {}),
    );
  }

  if (profiles?.leetcode?.trim()) {
    tasks.push(
      getLCAcceptedActivity(profiles.leetcode.trim(), days).then(merge).catch(() => {}),
    );
  }

  // GitHub does not have a classic accepted/non-accepted model; commits
  // are counted as "accepted" for display purposes.
  if (profiles?.github?.trim()) {
    tasks.push(
      require("../services/github/githubService")
        .getGithubDailyCommits(profiles.github.trim())
        .then((commitsByDay) => {
          for (const [date, count] of Object.entries(commitsByDay)) {
            if (!byDate[date]) continue;
            byDate[date].submissions += count;
            byDate[date].accepted += count;
          }
        })
        .catch(() => {}),
    );
  }

  await Promise.all(tasks);

  return { daily: dates.map((date) => byDate[date]) };
}

router.post("/total-accepted", async (req, res, next) => {
  try {
    const requestedDays = Number(req.body?.days);
    const days = Number.isInteger(requestedDays) ? requestedDays : 7;
    return res.json(await getTotalAcceptedActivity(req.body?.profiles, days));
  } catch (error) {
    return next({
      status: error.status || 502,
      message: error.message || "Failed to fetch accepted activity",
    });
  }
});

module.exports = router;
