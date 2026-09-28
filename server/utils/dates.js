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
  const date = value instanceof Date ? new Date(value) : new Date(value);
  return date.toISOString().slice(0, 10);
}

function buildCalendar(counts, firstActivityDate, days = 7) {
  const fullDates = getLastNDates(30);
  if (!firstActivityDate) return [];

  const firstDate = firstActivityDate > fullDates[0]
    ? firstActivityDate
    : fullDates[0];
  const availableDates = fullDates.filter((date) => date >= firstDate).slice(-days);

  return availableDates.map((date) => ({
    date,
    count: Number(counts[date]) || 0,
  }));
}

module.exports = { getLastNDates, toUTCDateString, buildCalendar };
