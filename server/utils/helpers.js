function parseSubmissionDays(value) {
  if (value === undefined) return 7;

  const days = Number(value);
  if (!Number.isInteger(days) || days <= 0) return 7;

  return Math.min(30, Math.max(1, days));
}

function normalizeStats(platform, data, handle) {
  const source = data && typeof data === "object" ? data : {};
  const solved = parseCount(source.problemSolved ?? source.totalSolved);
  const rating = parseCount(source.rating ?? source.currentRating);
  const problems = Array.isArray(source.problems) ? source.problems.map(normalizeProblem) : [];
  const breakdown = buildProblemBreakdown(problems);

  return {
    ...source,
    platform,
    handle: source.handle || source.username || source.name || handle,
    username: source.username || source.name || source.handle || handle,
    solved,
    problemSolved: solved,
    totalSolved: solved,
    rating,
    currentRating: parseCount(source.currentRating ?? rating),
    rank: source.rank || source.globalRank || null,
    problems,
    problemBreakdown: breakdown,
  };
}

function parseCount(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;

  const normalized = value.trim().replace(/,/g, "").toUpperCase();
  const match = normalized.match(/^(\d+(?:\.\d+)?)\s*([KMB])?$/);
  if (!match) return 0;

  const multiplier = { K: 1e3, M: 1e6, B: 1e9 }[match[2]] || 1;
  return Math.round(Number(match[1]) * multiplier) || 0;
}

function normalizeProblem(problem) {
  const source = problem && typeof problem === "object" ? problem : {};
  const tags = source.tags ?? source.topicTags ?? source.topics ?? [];
  const normalizedTags = Array.isArray(tags)
    ? tags.map((tag) => typeof tag === "string" ? tag : tag?.name).filter(Boolean)
    : String(tags).split(",").map((tag) => tag.trim()).filter(Boolean);
  const difficulty = source.difficulty ?? source.level ?? source.levelName ?? null;
  const ratingValue = source.rating ?? source.difficultyRating ?? null;

  return {
    ...source,
    id: String(source.id ?? source.problemId ?? source.titleSlug ?? source.name ?? ""),
    name: source.name || source.title || source.titleSlug || "Unnamed problem",
    url: source.url || source.problemUrl || null,
    rating: Number.isFinite(Number(ratingValue)) ? Number(ratingValue) : null,
    difficulty: difficulty === null ? null : String(difficulty),
    level: difficulty === null ? null : String(difficulty),
    tags: normalizedTags,
  };
}

function buildProblemBreakdown(problems) {
  const breakdown = { byDifficulty: {}, byRating: {}, byTag: {} };
  for (const problem of problems) {
    if (problem.difficulty) {
      breakdown.byDifficulty[problem.difficulty] = (breakdown.byDifficulty[problem.difficulty] || 0) + 1;
    }
    if (problem.rating !== null) {
      const rating = String(problem.rating);
      breakdown.byRating[rating] = (breakdown.byRating[rating] || 0) + 1;
    }
    for (const tag of problem.tags) {
      breakdown.byTag[tag] = (breakdown.byTag[tag] || 0) + 1;
    }
  }
  return breakdown;
}

module.exports = { parseSubmissionDays, normalizeStats, normalizeProblem, parseCount };
