const router = require("express").Router();

const { parseSubmissionDays } = require("../utils/helpers");
const { getLastNDates } = require("../utils/dates");
const { validateHandle } = require("../utils/validateHandle");
const { getCodeforcesActivity, getLeetcodeActivity } = require("../services/activityService");

const activitySources = {
  codeforces: getCodeforcesActivity,
  leetcode: getLeetcodeActivity,
};

router.post("/total-accepted", async (req, res) => {
  const days = parseSubmissionDays(req.body?.days);
  const profiles = req.body?.profiles ?? {};
  const dates = getLastNDates(days);
  const daily = dates.map((date) => ({ date, submissions: 0, accepted: null, nonAccepted: null }));
  const byDate = new Map(daily.map((row) => [row.date, row]));
  const handles = Object.entries(activitySources).flatMap(([platform, fetchActivity]) => {
    const handle = profiles[platform];
    if (handle === "" || handle == null) return [];
    return [{ platform, handle: validateHandle(handle), fetchActivity }];
  });

  const statuses = await Promise.all(handles.map(async ({ platform, handle, fetchActivity }) => {
    try {
      const activity = await fetchActivity(handle, days);
      for (const row of activity.daily) {
        const day = byDate.get(row.date);
        if (!day) continue;
        day.submissions += row.submissions;
        if (platform === "codeforces") {
          day.accepted = row.acceptedSubmissions;
          day.nonAccepted = row.nonAcceptedSubmissions;
        }
      }
      return [platform, { ok: true }];
    } catch (error) {
      console.error(`[graphs] ${platform} failed:`, error.message);
      return [platform, { ok: false, error: "Activity is unavailable" }];
    }
  }));

  res.json({ daily, platformStatus: Object.fromEntries(statuses) });
});

module.exports = router;
