const { getLastNDates } = require("../../utils/dates");
const { getCFAcceptedActivity } = require("../codeforces/cfTotalAccepted");
const { getCFNotAcceptedActivity } = require("../codeforces/cfNotAccepted");
const { getCodeChefAcceptedActivity } = require("../codechef/ccTotalAccepted");
const { getCodeChefNotAcceptedActivity } = require("../codechef/ccNotAccepted");
const { getAtcoderAcceptedActivity } = require("../atcoder/atTotalAccepted");
const { getAtcoderNotAcceptedActivity } = require("../atcoder/atNotAccepted");
const { getGfgAcceptedActivity } = require("../geeksforgeeks/gfgTotalAccepted");
const { getGfgNotAcceptedActivity } = require("../geeksforgeeks/gfgNotAccepted");
const { getLCAcceptedActivity } = require("../leetcode/lcService");
const { getLCAcceptedActivity: getLCAcceptedSubmissionsActivity } = require("../leetcode/lcTotalAccepted");
const { getLCNotAcceptedActivity } = require("../leetcode/lcNotAccepted");

const acceptedActivityServices = {
  codeforces: async (handle, days) => {
    const [accepted, nonAccepted] = await Promise.all([
      getCFAcceptedActivity(handle, days),
      getCFNotAcceptedActivity(handle, days),
    ]);
    const byDate = {};
    for (const row of [...accepted, ...nonAccepted]) {
      const entry = byDate[row.date] || { submissions: 0, accepted: 0, nonAccepted: 0 };
      entry.submissions += row.submissions || 0;
      entry.accepted += row.accepted || 0;
      entry.nonAccepted += row.nonAccepted || 0;
      byDate[row.date] = entry;
    }
    return Object.entries(byDate).map(([date, row]) => ({ date, ...row }));
  },
  codechef: (handle, days) => mergeActivities(
    getCodeChefAcceptedActivity(handle, days),
    getCodeChefNotAcceptedActivity(handle, days),
  ),
  atcoder: (handle, days) => mergeActivities(
    getAtcoderAcceptedActivity(handle, days),
    getAtcoderNotAcceptedActivity(handle, days),
  ),
  gfg: (handle, days) => mergeActivities(
    getGfgAcceptedActivity(handle, days),
    getGfgNotAcceptedActivity(handle, days),
  ),
  leetcode: async (handle, days) => {
    const [accepted, nonAccepted] = await Promise.all([
      getLCAcceptedSubmissionsActivity(handle, days),
      getLCNotAcceptedActivity(handle, days),
    ]);
    const byDate = {};
    for (const row of [...accepted, ...nonAccepted]) {
      const entry = byDate[row.date] || { submissions: 0, accepted: 0, nonAccepted: 0 };
      entry.submissions += row.submissions || 0;
      entry.accepted += row.accepted || 0;
      entry.nonAccepted += row.nonAccepted || 0;
      byDate[row.date] = entry;
    }
    return Object.entries(byDate).map(([date, row]) => ({ date, ...row }));
  },
};

async function mergeActivities(acceptedPromise, nonAcceptedPromise) {
  const [accepted, nonAccepted] = await Promise.all([acceptedPromise, nonAcceptedPromise]);
  const byDate = {};
  for (const row of [...accepted, ...nonAccepted]) {
    const entry = byDate[row.date] || { submissions: 0, accepted: 0, nonAccepted: 0 };
    entry.submissions += Number(row.submissions) || 0;
    entry.accepted += Number(row.accepted) || 0;
    entry.nonAccepted += Number(row.nonAccepted) || 0;
    byDate[row.date] = entry;
  }
  return Object.entries(byDate).map(([date, row]) => ({ date, ...row }));
}

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
  const totals = Object.fromEntries(dates.map((date) => [date, {
  submissions: 0,
  accepted: 0,
  nonAccepted: 0,
  }]));
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
    const daily = Object.fromEntries(dates.map((date) => [date, {
      submissions: 0,
      accepted: 0,
      nonAccepted: 0,
    }]));
    for (const entry of accepted) {
      if (!(entry.date in totals)) continue;
      daily[entry.date].submissions += Number(entry.submissions) || 0;
      daily[entry.date].accepted += Number(entry.accepted) || 0;
      daily[entry.date].nonAccepted += Number(entry.nonAccepted) || 0;
      totals[entry.date].submissions += Number(entry.submissions) || 0;
      totals[entry.date].accepted += Number(entry.accepted) || 0;
      totals[entry.date].nonAccepted += Number(entry.nonAccepted) || 0;
    }
    byProfile[key] = { platform, handle, daily };
  }

  return {
    range: { days: safeDays, from: dates[0], to: dates[dates.length - 1] },
    daily: dates.map((date) => ({ date, ...totals[date] })),
    totalSubmissions: Object.values(totals).reduce((sum, row) => sum + row.submissions, 0),
    totalAccepted: Object.values(totals).reduce((sum, row) => sum + row.accepted, 0),
    totalNonAccepted: Object.values(totals).reduce((sum, row) => sum + row.nonAccepted, 0),
    byProfile,
  };
}

module.exports = { getTotalAcceptedActivity };






/* AC: solved over time */


function buildSolveActivity(firstSolves, tzOffsetMin = DEFAULT_TZ_OFFSET_MIN) {
   
    const perDay = {};

    for (const s of firstSolves.values()) {
        const d = toDate(s.creationTimeSeconds * 1000, tzOffsetMin);
        perDay[d] = (perDay[d] || 0) + 1;
    }

    const emptySummary = { today: 0, yesterday: 0, last7Days: 0, last30Days: 0, total: 0 };

    const dates = Object.keys(perDay).sort();

    if (!dates.length) {
        return { summary: emptySummary, daily: [], monthly: [], cumulative: [] };
    }

    const today = toDate(Date.now(), tzOffsetMin);
  
    const daily = dateRange(dates[0], today).map((date) => ({
        date,
        solved: perDay[date] || 0,
    }));

    let running = 0;
    const cumulative = daily.map(({ date, solved }) => ({ date, total: (running += solved) }));

    const monthlyMap = {};
    for (const { date, solved } of daily) {
        const month = date.slice(0, 7);
        monthlyMap[month] = (monthlyMap[month] || 0) + solved;
    }
    const monthly = Object.entries(monthlyMap).map(([month, solved]) => ({ month, solved }));

    const sumLast = (n) => daily.slice(-n).reduce((a, d) => a + d.solved, 0);

    return {
        summary: {
            today: daily[daily.length - 1].solved,
            yesterday: daily.length > 1 ? daily[daily.length - 2].solved : 0,
            last7Days: sumLast(7),
            last30Days: sumLast(30),
            total: running,
        },
        daily,      // [{ date, solved }]            -> daily bar/line chart
        monthly,    // [{ month, solved }]           -> monthly chart
        cumulative, // [{ date, total }]             -> "since the beginning" chart
    };
}
