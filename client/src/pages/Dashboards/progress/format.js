export const domains = [
  { id: "dsa", platform: "leetcode", name: "DSA", source: "LeetCode", color: "#1b665a" },
  { id: "cp", platform: "codeforces", name: "CP", source: "Codeforces", color: "#395d91" },
  { id: "dev", platform: "github", name: "Dev", source: "GitHub", color: "#845322" },
];

const numberFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
const dateFormat = new Intl.DateTimeFormat(undefined, { timeZone: "UTC", month: "short", day: "numeric" });
export const number = value => Number.isFinite(value) ? numberFormat.format(value) : "Unavailable";
export const shortDate = iso => dateFormat.format(new Date(iso + "T00:00:00Z"));
export const validGoal = value => Number.isSafeInteger(value) && value > 0;

export function comparison(points, median, calendar) {
  if (median == null) return "Not enough history";
  if (points == null) return "Comparison unavailable";
  const margin = median * calendar.nearFraction;
  let label = "Near";
  if (points > median + margin) label = "Above";
  if (points < median - margin) label = "Below";
  return `${label} your ${calendar.baselineWeeks}-week median (${number(median)} pts)`;
}

// Bounds agree when missing days cannot change the answer.
export function streaks(days) {
  function count(includeUnknown) {
    let current = 0, longest = 0;
    for (const { activeDay } of days) {
      current = (activeDay ?? includeUnknown) ? current + 1 : 0;
      longest = Math.max(longest, current);
    }
    return { current, longest };
  }
  const low = count(false), high = count(true);
  function label(field) {
    if (!days.length) return "Unavailable";
    if (low[field] === high[field]) return number(low[field]);
    return low[field] ? "≥ " + number(low[field]) : "Unknown";
  }
  return { current: label("current"), longest: label("longest") };
}
