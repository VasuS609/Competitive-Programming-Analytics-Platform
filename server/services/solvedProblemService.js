const { prepare, transaction } = require("../db");

const selectProblems = prepare(`
  SELECT platform, handle, problem_id AS id, name, url, rating, tags, first_seen_at AS firstSeenAt
  FROM solved_problems
  WHERE platform = ? AND handle = ?
  ORDER BY first_seen_at DESC, name ASC
`);

const upsertProblem = prepare(`
  INSERT INTO solved_problems
    (platform, handle, problem_id, name, url, rating, tags, first_seen_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(platform, handle, problem_id) DO UPDATE SET
    name = excluded.name,
    url = excluded.url,
    rating = excluded.rating,
    tags = excluded.tags
`);

function getSolvedProblems(platform, handle) {
  return selectProblems.all(platform, handle).map((problem) => ({
    ...problem,
    rating: problem.rating === null ? null : Number(problem.rating),
    tags: parseTags(problem.tags),
  }));
}

function parseTags(value) {
  if (!value) return [];
  try {
    const tags = JSON.parse(value);
    return Array.isArray(tags) ? tags : [];
  } catch {
    return [];
  }
}

function syncSolvedProblems(platform, handle, problems) {
  const rows = Array.isArray(problems) ? problems : [];
  const now = new Date().toISOString();
  const writeRows = transaction(() => {
    for (const problem of rows) {
      if (!problem?.id || !problem?.name) continue;
      upsertProblem.run(
        platform,
        handle,
        String(problem.id),
        String(problem.name),
        problem.url || null,
        Number.isFinite(Number(problem.rating)) ? Number(problem.rating) : null,
        JSON.stringify(Array.isArray(problem.tags) ? problem.tags : []),
        now,
      );
    }
  });

  writeRows();
}

module.exports = { getSolvedProblems, syncSolvedProblems };
