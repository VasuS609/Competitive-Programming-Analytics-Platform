const { getLastNDates } = require("../../utils/dates");
const { getCFAcceptedActivity } = require("../codeforces/cfService");
const { getLCAcceptedActivity } = require("../leetcode/lcService");

const acceptedActivityServices = {
  codeforces: getCFAcceptedActivity,
  leetcode: getLCAcceptedActivity,
};

function normalizeProfiles(profiles) {
  if (!profiles || typeof profiles !== "object") return [];

  return Object.entries(profiles)
    .map(([platform, handle]) => ({
      platform: String(platform).trim().toLowerCase(),
      handle: typeof handle === "string" ? handle.trim() : "",
    }))
    .filter(({ platform, handle }) => handle && acceptedActivityServices[platform]);
}

async function getTotalAcceptedActivity(profiles, days = 7) {
  const safeDays = Number.isInteger(days) && days > 0 ? Math.min(days, 30) : 7;
  const loadedProfiles = normalizeProfiles(profiles);
  const dates = getLastNDates(safeDays);
  const totals = Object.fromEntries(dates.map((date) => [date, 0]));
  const byProfile = {};

  const results = await Promise.all(
    loadedProfiles.map(async ({ platform, handle }) => ({
      platform,
      handle,
      accepted: await acceptedActivityServices[platform](handle, safeDays),
    })),
  );

  for (const { platform, handle, accepted } of results) {
    const key = `${platform}:${handle.toLowerCase()}`;
    const daily = Object.fromEntries(dates.map((date) => [date, 0]));
    for (const entry of accepted) {
      if (!(entry.date in totals)) continue;
      daily[entry.date] += Number(entry.accepted) || 0;
      totals[entry.date] += Number(entry.accepted) || 0;
    }
    byProfile[key] = { platform, handle, daily };
  }

  return {
    range: { days: safeDays, from: dates[0], to: dates[dates.length - 1] },
    daily: dates.map((date) => ({ date, accepted: totals[date] })),
    totalAccepted: Object.values(totals).reduce((sum, count) => sum + count, 0),
    byProfile,
  };
}

module.exports = { getTotalAcceptedActivity };