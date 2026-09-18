const { LeetCode } = require("leetcode-query");

const leetcode = new LeetCode();
const cache = {};
const CACHE_TTL = 10 * 60 * 1000;

function getLastSevenDates() {
  const dates = [];
  const today = new Date();

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    dates.push(date.toISOString().slice(0, 10));
  }

  return dates;
}

async function fetchLeetcodeSubmissionCalendar(handle) {
  const response = await leetcode.graphql({
    operationName: "userProfileCalendar",
    query: `
      query userProfileCalendar($username: String!) {
        matchedUser(username: $username) {
          userCalendar { submissionCalendar }
        }
      }
    `,
    variables: { username: handle },
  });

  const calendarString = response.data?.matchedUser?.userCalendar?.submissionCalendar;
  const calendar = calendarString ? JSON.parse(calendarString) : {};
  const counts = Object.fromEntries(getLastSevenDates().map((date) => [date, 0]));

  Object.entries(calendar).forEach(([timestamp, count]) => {
    const date = new Date(Number(timestamp) * 1000).toISOString().slice(0, 10);
    if (date in counts) counts[date] = Number(count) || 0;
  });

  return getLastSevenDates().map((date) => ({ date, count: counts[date] }));
}

async function getLeetcodeSubmissionCalendar(handle) {
  const cached = cache[handle];
  if (cached && Date.now() < cached.expiresAt) return cached.data;

  const data = await fetchLeetcodeSubmissionCalendar(handle);
  cache[handle] = { data, expiresAt: Date.now() + CACHE_TTL };
  return data;
}

module.exports = { getLeetcodeSubmissionCalendar };