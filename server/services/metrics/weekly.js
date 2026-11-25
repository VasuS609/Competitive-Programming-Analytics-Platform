const { toUTCDateString } = require("../../utils/dates");
const { calendar } = require("./config");

function shiftDay(day, days) {
  const date = new Date(day + "T00:00:00Z");
  date.setUTCDate(date.getUTCDate() + days);
  return toUTCDateString(date);
}

function monday(day) {
  const weekday = new Date(day + "T00:00:00Z").getUTCDay();
  return shiftDay(day, -((weekday + calendar.daysPerWeek - 1) % calendar.daysPerWeek));
}

// Coverage dates are inclusive. Unknown days are null; measured inactivity is zero.
function calendarDays({ from, to, complete }) {
  if (!from || !to || toUTCDateString(from) !== from || toUTCDateString(to) !== to || from > to) {
    throw new RangeError("Expected an inclusive UTC date range");
  }
  const days = new Map();
  for (let date = from; date <= to; date = shiftDay(date, 1)) {
    days.set(date, { date, points: complete ? 0 : null, activeDay: complete ? false : null });
  }
  return days;
}

function weekly(daily, coverage) {
  const weeks = new Map();
  for (const day of daily) {
    const week = monday(day.date);
    if (!weeks.has(week)) {
      weeks.set(week, { week, points: null, activeDays: null,
        complete: coverage.complete && week >= coverage.from &&
          shiftDay(week, calendar.daysPerWeek - 1) <= coverage.to });
    }
    const row = weeks.get(week);
    if (day.points != null) row.points = (row.points ?? 0) + day.points;
    if (day.activeDay != null) row.activeDays = (row.activeDays ?? 0) + Number(day.activeDay);
  }
  return [...weeks.values()];
}

function baselineMedian(weeklyRows, asOf) {
  const end = monday(asOf);
  const start = shiftDay(end, -calendar.baselineWeeks * calendar.daysPerWeek);
  const values = weeklyRows.filter(row => row.week >= start && row.week < end &&
    row.complete && Number.isFinite(row.points)).map(row => row.points).sort((a,b) => a-b);
  if (values.length < calendar.minimumWeeks) return null;
  const middle = Math.floor(values.length / 2);
  return values.length % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2;
}

// A positive observation wins; inactivity requires known inactivity in every supplied domain.
function activeDays(...series) {
  const rows = series.map(days => new Map(days.map(day => [day.date, day.activeDay])));
  const dates = new Set(rows.flatMap(days => [...days.keys()]));
  return [...dates].sort().map(date => {
    const flags = rows.map(days => days.get(date));
    const activeDay = flags.includes(true) ? true : flags.every(flag => flag === false) ? false : null;
    return { date, activeDay };
  });
}

module.exports = { calendarDays, monday, weekly, baselineMedian, activeDays };
