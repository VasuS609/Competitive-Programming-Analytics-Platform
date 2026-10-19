async function fetchRatingHistory(handle) {

  const response = await fetch(
    `https://codeforces.com/api/user.rating?handle=${encodeURIComponent(handle)}`,
  );

  const body = await response.json().catch(() => ({}));
  
  if (!response.ok || body.status !== "OK") {
    const error = new Error(body.comment || `Codeforces API Error ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return (body.result || []).map((contest) => ({
    contestId: contest.contestId,
    contestName: contest.contestName,
    date: new Date(contest.ratingUpdateTimeSeconds * 1000).toISOString().slice(0, 10),
    time: new Date(contest.ratingUpdateTimeSeconds * 1000).toISOString(),
    rank: contest.rank,
    oldRating: contest.oldRating,
    newRating: contest.newRating,
    ratingChange: contest.newRating - contest.oldRating,
  }));
}

module.exports = { fetchRatingHistory };
