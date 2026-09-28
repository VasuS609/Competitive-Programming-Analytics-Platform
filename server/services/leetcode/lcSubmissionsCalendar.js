const { getLCStats } = require("./lcService");

function getLastSevenDates() {
  const dates = [];
  const today = new Date();

  today.setUTCHours(0, 0, 0, 0);
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - offset);
    dates.push(date.toISOString().slice(0, 10));
  }

  return dates;
}

async function getLeetcodeSubmissionCalendar(handle) {
  const profile = await getLCStats(handle);

  let calendar = {};
  try {
    calendar = JSON.parse(profile.submissionCalendar || "{}");
  } catch {
    calendar = {};
  }

  const dates = getLastSevenDates();
  const counts = Object.fromEntries(dates.map((date) => [date, 0]));

  Object.entries(calendar).forEach(([timestamp, count]) => {
    const date = new Date(Number(timestamp) * 1000).toISOString().slice(0, 10);
    if (date in counts) counts[date] += Number(count) || 0;
  });

  return dates.map((date) => ({ date, count: counts[date] }));
}

module.exports = { getLeetcodeSubmissionCalendar };