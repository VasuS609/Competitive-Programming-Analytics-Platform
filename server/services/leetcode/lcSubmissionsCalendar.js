const { getLCStats } = require("./lcService");
const { buildCalendar, safeDay } = require("../../utils/dates");

function countLeetcodeSubmissions(calendar) {
  const entries = typeof calendar === "string" ? JSON.parse(calendar || "{}") : calendar;
  const counts = {};
  for (const [timestamp, value] of Object.entries(entries || {})) {
    const date = safeDay(timestamp);
    const count = Number(value);
    if (date && Number.isFinite(count) && count > 0) {
      counts[date] = (counts[date] || 0) + count;
    }
  }
  return counts;
}

async function getLeetcodeSubmissionCalendar(handle, days = 7) {
  const { submissionCalendar } = await getLCStats(handle);
  return buildCalendar(countLeetcodeSubmissions(submissionCalendar), days);
}

module.exports = { countLeetcodeSubmissions, getLeetcodeSubmissionCalendar };