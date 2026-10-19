const { getCodeChefStats } = require("./codechefService");
async function getCodeChefRatingHistory(handle) {
  const stats = await getCodeChefStats(handle);
  return (stats.ratingData || []).map((item) => ({
    date: item.end_date || item.date || null,
    contestName: item.name || item.contestName || null,
    rating: Number(item.rating) || 0,
    rank: Number(item.rank) || null,
  }));
}
module.exports = { getCodeChefRatingHistory };
