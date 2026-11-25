const { toUTCDateString } = require("../../utils/dates");
const { dev } = require("./config");
const { calendarDays, monday, weekly } = require("./weekly");

const scopeNote = "Merged PRs are excluded: the collection indexes PR openings. Daily commit counts do not identify merge commits. Review contributions represent the latest submitted review per PR.";

// Input is one dated contribution (or a daily commit count per repository).
// An events fallback supplies only UTC days with observed public activity.
function devScore(contributions, sourceCoverage, eventDays = []) {
  const available = Array.isArray(contributions);
  const pointsCoverage = { ...sourceCoverage, complete: available && sourceCoverage.complete };
  const days = calendarDays(pointsCoverage);
  const repositories = new Map();
  const unknownRepositories = new Set();
  for (const day of days.values()) {
    if (pointsCoverage.complete) Object.assign(day, { commit: 0, openedPR: 0, review: 0, issue: 0 });
  }
  if (available) {
    for (const { date, type, count = 1, repository } of contributions) {
      const day = days.get(toUTCDateString(date));
      if (!day || !["commit", "openedPR", "review", "issue"].includes(type)) continue;
      if (!Number.isSafeInteger(count) || count <= 0) continue;
      day.activeDay = true;
      const oldCount = day[type] ?? 0;
      day[type] = oldCount + count;
      const credited = type === "commit"
        ? Math.min(day.commit, dev.commitCap) - Math.min(oldCount, dev.commitCap)
        : count;
      day.points = (day.points ?? 0) + credited * dev[type];
      const week = monday(day.date);
      if (repository) {
        if (!repositories.has(week)) repositories.set(week, new Set());
        repositories.get(week).add(repository);
      } else {
        unknownRepositories.add(week);
      }
    }
  } else {
    for (const date of eventDays) {
      const day = days.get(date);
      if (day) day.activeDay = true;
    }
  }

  const daily = [...days.values()];
  const weeks = weekly(daily, pointsCoverage);
  for (const week of weeks) {
    const known = pointsCoverage.complete && !unknownRepositories.has(week.week);
    week.repositories = known ? (repositories.get(week.week)?.size ?? 0) : null;
  }
  const reason = available ? [sourceCoverage.reason, scopeNote].filter(Boolean).join(" ") :
    (sourceCoverage.reason || "No GitHub token configured / limited to about the last 90 days");
  return { daily, weekly: weeks, coverage: { ...sourceCoverage, complete: false, reason } };
}

module.exports = { devScore };
