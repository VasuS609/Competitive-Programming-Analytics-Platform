const { safeDay, toUTCDateString } = require("../../utils/dates");
const { classifyVerdict } = require("../../utils/helpers");
const { cp, calendar } = require("./config");
const { calendarDays, weekly } = require("./weekly");

function ratingPoints(problemRating, currentRating) {
  if (![problemRating, currentRating].every(r => Number.isFinite(r) && r > 0)) return cp.unratedPoints;
  const difference = problemRating - currentRating;
  if (difference < -cp.near) return cp.belowPoints;
  if (difference <= cp.near) return cp.nearPoints;
  if (difference <= cp.stretch) return cp.stretchPoints;
  return cp.abovePoints;
}

// Rating history is the normalized array returned by fetchRatingHistory.
function ratingExtras(history, from, to) {
  if (!Array.isArray(history)) return { contests: null, ratingTrend: null };
  const start = new Date(to.slice(0, 7) + "-01T00:00:00Z");
  start.setUTCMonth(start.getUTCMonth() - calendar.ratingMonths + 1);
  const trendFrom = toUTCDateString(start);
  const months = new Map();
  const month = new Date(from.slice(0, 7) + "-01T00:00:00Z");
  while (toUTCDateString(month) <= to) {
    months.set(toUTCDateString(month).slice(0, 7), 0);
    month.setUTCMonth(month.getUTCMonth() + 1);
  }
  const ratingTrend = [];
  const seen = new Set();
  for (const entry of history) {
    const date = entry.date;
    if (!date || date !== toUTCDateString(date) || date > to || seen.has(entry.contestId)) continue;
    seen.add(entry.contestId);
    const key = date.slice(0, 7);
    if (months.has(key)) months.set(key, months.get(key) + 1);
    if (date >= trendFrom && Number.isFinite(entry.newRating)) {
      ratingTrend.push({ date, contestId: entry.contestId, rating: entry.newRating });
    }
  }
  ratingTrend.sort((a,b) => a.date.localeCompare(b.date) || a.contestId - b.contestId);
  return { contests: [...months].map(([month, count]) => ({ month, count })), ratingTrend };
}

function cpScore(submissions, currentRating, ratingHistory, sourceCoverage) {
  const coverage = { ...sourceCoverage };
  if (!Array.isArray(submissions)) Object.assign(coverage, { complete: false, reason: "Codeforces submissions unavailable" });
  const days = calendarDays(coverage);
  const solved = new Set();
  const attemptedInContest = new Set();
  let upsolved = 0;
  const ordered = [...(submissions ?? [])].sort((a,b) =>
    a.creationTimeSeconds - b.creationTimeSeconds || a.id - b.id);
  for (const submission of ordered) {
    const date = safeDay(submission.creationTimeSeconds);
    if (!date || date > coverage.to) continue;
    const day = days.get(date);
    if (day) { day.activeDay = true; day.points ??= 0; }
    const problem = submission.problem;
    const contest = problem?.contestId ?? submission.contestId ?? problem?.problemsetName;
    if (contest == null || !problem?.index) continue;
    const key = JSON.stringify([contest, problem.index]);
    if (solved.has(key)) continue;
    const type = submission.author?.participantType;
    if (classifyVerdict(submission.verdict) !== "accepted") {
      if (type === "CONTESTANT") attemptedInContest.add(key);
      continue;
    }
    solved.add(key);
    if (!day) continue;
    day.points += ratingPoints(problem.rating, currentRating);
    day.solved = (day.solved ?? 0) + 1;
    if (attemptedInContest.has(key) && ["PRACTICE", "VIRTUAL"].includes(type)) upsolved++;
  }
  const daily = [...days.values()];
  for (const day of daily) day.solved ??= day.points == null ? null : 0;
  const weeks = weekly(daily, coverage);
  if (!Array.isArray(ratingHistory)) {
    coverage.complete = false;
    coverage.reason = [coverage.reason, "Rated contest history unavailable"].filter(Boolean).join(". ");
  }
  return { daily, weekly: weeks, upsolved: Array.isArray(submissions) ? upsolved : null,
    ...ratingExtras(ratingHistory, coverage.from, coverage.to), coverage };
}

module.exports = { cpScore, ratingPoints };
