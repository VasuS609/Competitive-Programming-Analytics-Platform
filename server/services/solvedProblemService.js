const { prepare } = require("../db");

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

const selectProblems = prepare(`
  SELECT problem_id AS id, name, url, rating, tags, first_seen_at
  FROM solved_problems
  WHERE platform = ? AND handle = ?
  ORDER BY first_seen_at DESC, problem_id ASC
`);

function normalizeHandle(handle) {
  return String(handle).trim().toLowerCase();
}

function serializeTags(tags) {
  return JSON.stringify(Array.isArray(tags) ? tags : []);
}

function syncSolvedProblems(platform, handle, problems) {
  const normalizedHandle = normalizeHandle(handle);
  const firstSeenAt = new Date().toISOString();

  for (const problem of problems) {
    if (!problem?.id || !problem.name) continue;
    upsertProblem.run(
      platform,
      normalizedHandle,
      String(problem.id),
      problem.name,
      problem.url || null,
      Number.isFinite(problem.rating) ? problem.rating : null,
      serializeTags(problem.tags),
      firstSeenAt,
    );
  }
}

function getSolvedProblems(platform, handle) {
  return selectProblems.all(platform, normalizeHandle(handle)).map((problem) => {
    let tags = [];
    try {
      tags = JSON.parse(problem.tags || "[]");
    } catch {
      tags = [];
    }

    return { ...problem, tags };
  });
}

module.exports = { syncSolvedProblems, getSolvedProblems };