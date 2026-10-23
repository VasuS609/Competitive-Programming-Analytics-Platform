function getLastNDates(n) {
  const dates = [];
  const count = Math.max(0, Number.isInteger(n) ? n : 0);
  const today = new Date();

  today.setUTCHours(0, 0, 0, 0);
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - offset);
    dates.push(date.toISOString().slice(0, 10));
  }

  return dates;
}

function toUTCDateString(value) {
  if (typeof value === "string" && /^\d{4}-\d{1,2}-\d{1,2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10);
  }
  const date = value instanceof Date ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function buildCalendar(counts, firstActivityDate, days = 7) {
  const fullDates = getLastNDates(30);
  return fullDates.slice(-days).map((date) => ({
    date,
    count: Number(counts[date]) || 0,
  }));
}

module.exports = { getLastNDates, toUTCDateString, buildCalendar };
