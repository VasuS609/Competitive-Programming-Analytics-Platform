function parseSubmissionDays(value) {
  if (value === undefined) return 7;

  const days = Number(value);
  if (!Number.isInteger(days) || days <= 0) return 7;

  return Math.min(30, Math.max(1, days));
}

function normalizeStats(platform, data, handle) {
  const solved = data.problemSolved ?? data.totalSolved ?? 0;
  const rating = data.rating ?? data.currentRating ?? 0;

  return {
    ...data,
    platform,
    handle: data.handle || data.username || data.name || handle,
    username: data.username || data.name || data.handle || handle,
    solved,
    problemSolved: solved,
    totalSolved: solved,
    rating,
    currentRating: data.currentRating ?? rating,
    rank: data.rank || data.globalRank || null,
    problems: Array.isArray(data.problems) ? data.problems : [],
  };
}

module.exports = { parseSubmissionDays, normalizeStats };
