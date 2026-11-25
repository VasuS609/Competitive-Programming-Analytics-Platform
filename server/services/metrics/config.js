// Public scoring rules. Phase 2 can return this object with the metrics.
module.exports = {
  // Points per distinct first accepted problem seen in the supplied history.
  dsa: { easy: 1, medium: 3, hard: 6, unknown: 1 },
  // Rating difference is problem rating minus the user's current rating.
  cp: { near: 200, stretch: 400, belowPoints: 0.5, nearPoints: 1, stretchPoints: 2, abovePoints: 3, unratedPoints: 1 },
  // Weights apply to dated contributions. The cap is shared across all repositories.
  dev: { commit: 1, commitCap: 5, openedPR: 3, review: 2, issue: 1 },
  // A UTC week starts on Monday. Compare only completed weeks with observed totals.
  calendar: { daysPerWeek: 7, baselineWeeks: 8, minimumWeeks: 4, nearFraction: 0.2, ratingMonths: 6 },
  // Default weekly targets, in each domain's own points.
  goals: { dsa: 12, cp: 8, dev: 10 },
  // Visible calendar weeks, including the current week.
  range: { defaultWeeks: 8, minWeeks: 1, maxWeeks: 12 },
  // GitHub connections allow 100 nodes per page. Detect repository truncation
  // by comparing the returned groups with GitHub's total repository count.
  github: { pageSize: 100, maxRepositories: 25 },
};
