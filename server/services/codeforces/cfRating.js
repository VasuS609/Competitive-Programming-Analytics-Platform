const { fetchJson } = require("../../utils/httpClient");

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
    // Date stored and returned as UTC.
    date: new Date(contest.ratingUpdateTimeSeconds * 1000).toISOString().slice(0, 10),
    time: new Date(contest.ratingUpdateTimeSeconds * 1000).toISOString(),
    rank: contest.rank,
    oldRating: contest.oldRating,
    newRating: contest.newRating,
    rating: contest.newRating,
    ratingChange: contest.newRating - contest.oldRating,
  }));
}

module.exports = { fetchRatingHistory };
