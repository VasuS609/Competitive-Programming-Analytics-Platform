const {
  fetchUserInfo,
  fetchUserContestList,
} = require("@qatadaazzeh/atcoder-api");
const { buildCalendar, getLastNDates, toUTCDateString } = require("../../utils/dates");

const cache = {};
const CACHE_TTL = 10 * 60 * 1000;

async function getAtcoderData(handle) {
  const key = String(handle).trim().toLowerCase();
  const cached = cache[key];
  if (cached && Date.now() < cached.expiresAt) return cached.data;

  const [user, contests] = await Promise.all([
    fetchUserInfo(handle),
    fetchUserContestList(handle),
  ]);

  const data = {
    username: user.userName || handle,
    name: user.userName || handle,
    rank: user.currentRank || null,
    globalRank: user.userRank || null,
    rating: Number(user.userRating) || 0,
    currentRating: Number(user.userRating) || 0,
    highestRating: Number(user.userMaxRating) || 0,
    contestCount: Number(user.userContestCount) || contests.length,
    totalSolved: 0,
    problemSolved: 0,
    problems: [],
    contests: Array.isArray(contests) ? contests : [],
  };

  cache[key] = { data, expiresAt: Date.now() + CACHE_TTL };
  return data;
}

async function getAtcoderStats(handle) {
  const data = await getAtcoderData(handle);
  return data;
}

async function getAtcoderRatingHistory(handle) {
  const data = await getAtcoderData(handle);
  return data.contests
    .filter((contest) => contest.contestEndTime && Number.isFinite(Number(contest.userNewRating)))
    .map((contest) => ({
      date: toUTCDateString(contest.contestEndTime),
      rating: Number(contest.userNewRating),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

async function getAtcoderSubmissionCalendar(handle, days = 7) {
  const data = await getAtcoderData(handle);
  const dates = getLastNDates(30);
  const counts = Object.fromEntries(dates.map((date) => [date, 0]));
  let firstActivityDate = null;

  data.contests.forEach((contest) => {
    if (!contest.contestEndTime) return;
    const date = toUTCDateString(contest.contestEndTime);
    if (!(date in counts)) return;
    counts[date] += 1;
    if (!firstActivityDate || date < firstActivityDate) firstActivityDate = date;
  });

  return buildCalendar(counts, firstActivityDate, days);
}

module.exports = {
  getAtcoderStats,
  getAtcoderRatingHistory,
  getAtcoderSubmissionCalendar,
};
