const { prepare, transaction } = require("../db");
const {keyKey} = require("../utils/helpers");

const selectProblems = prepare(`
  SELECT platform, key, problem_id AS id, name, url, rating, tags, first_seen_at AS firstSeenAt
  FROM solved_problems
  WHERE platform = ? AND key = ?
  ORDER BY first_seen_at DESC, name ASC
`);

const upsertProblem = prepare(`
  INSERT INTO solved_problems
    (platform, key, problem_id, name, url, rating, tags, first_seen_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(platform, key, problem_id) DO UPDATE SET
    name = excluded.name,
    url = excluded.url,
    rating = excluded.rating,
    tags = excluded.tags
`);

function getSolvedProblems(platform, key) {
  return selectProblems.all(platform, key).map((problem) => ({
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

function syncSolvedProblems(platform, key, problems) {

  const rows = Array.isArray(problems) ? problems : [];
  const now = new Date().toISOString();

  const writeRows = transaction(() => {
  
    for (const problem of rows) {
      if (!problem?.id || !problem?.name) continue;
      upsertProblem.run(
        platform,
        key,
        String(problem.id),
        String(problem.name),
        problem.url || null,
        Number.isFinite(Number(problem.rating)) ? Number(problem.rating) : null,
        JSON.stringify(Array.isArray(problem.tags) ? problem.tags : []),
        
      );
    }
  });

  writeRows();
}

module.exports = { getSolvedProblems, syncSolvedProblems };
