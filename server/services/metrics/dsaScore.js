const { safeDay } = require("../../utils/dates");
const { dsa } = require("./config");
const { calendarDays, weekly } = require("./weekly");

function dsaScore(submissions, range) {
  const missing = !Array.isArray(submissions);
  const coverage = { ...range, complete: false, reason: missing ? "LeetCode submissions unavailable" :
    "Recent submissions only; earlier accepts and activity may be missing." };
  const days = calendarDays(coverage);
  const first = new Map();
  for (const submission of submissions ?? []) {
    const date = safeDay(submission.timestamp);
    if (!date) continue;
    const day = days.get(date);
    if (day) day.activeDay = true;
    if (submission.statusDisplay !== "Accepted" || !submission.titleSlug) continue;
    const previous = first.get(submission.titleSlug);
    if (!previous || Number(submission.timestamp) < Number(previous.timestamp)) {
      first.set(submission.titleSlug, submission);
    }
  }
  let unknownDifficulty = 0;
  for (const solve of first.values()) {
    const day = days.get(safeDay(solve.timestamp));
    if (!day) continue;
    const level = String(solve.difficulty ?? "").toLowerCase();
    const known = ["easy", "medium", "hard"].includes(level);
    if (!known) unknownDifficulty++;
    day.points = (day.points ?? 0) + (known ? dsa[level] : dsa.unknown);
    day.solved = (day.solved ?? 0) + 1;
  }
  const daily = [...days.values()];
  for (const day of daily) {
    if (day.activeDay) {
      day.points ??= 0;
      day.solved ??= 0;
    }
  }
  return { daily, weekly: weekly(daily, coverage), coverage, unknownDifficulty: missing ? null : unknownDifficulty };
}

module.exports = { dsaScore };
