const { fetchJson } = require("../../utils/httpClient");
const {safeDate, safeDay} = require("../../utils/dates");

async function fetchRatingHistory(handle) {
  const body = await fetchJson(
    `https://codeforces.com/api/user.rating?handle=${encodeURIComponent(handle)}`,
    {
      validate(b) {
        if (b.status !== "OK") {
          const e = new Error(b.comment || `Codeforces API Error`);
          e.status = 502;
          throw e;
        }
      },
    },
  );

  return (body.result || []).map((contest) => ({
    contestId: contest.contestId,
    contestName: contest.contestName,
    
    date: safeDay(contest.ratingUpdateTimeSeconds),
    time: safeDate(contest.ratingUpdateTimeSeconds),
    
    rank: contest.rank,
    oldRating: contest.oldRating,
    newRating: contest.newRating,
    rating: contest.newRating,
    ratingChange: contest.newRating - contest.oldRating,
  }));
}

module.exports = { fetchRatingHistory };
