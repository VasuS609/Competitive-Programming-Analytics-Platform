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
    const date = new Date(Date.UTC(year, month - 1, day));
    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) return null;
    return date.toISOString().slice(0, 10);
  }
  if (value == null) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function buildCalendar(counts, days = 7) {
  return getLastNDates(days).map((date) => ({
    date,
    count: Number(counts[date]) || 0,
  }));
}

//------------------Safedate -------------------------------------
const MIN_TS = 1230768000; // Jan 1, 2009. Anything older is a bad value.

function safeDate(seconds) {
  if (seconds === null || seconds === undefined || seconds === "") return null;
  const s = Number(seconds);
  if (!Number.isFinite(s)) return null;
  if (s < MIN_TS) return null;
  if (s > Date.now() / 1000 + 86400) return null;
  const d = new Date(s * 1000);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function safeDay(seconds) {
  const iso = safeDate(seconds);
  return iso ? iso.slice(0, 10) : null;
}
//----------------------------------------------

module.exports = { MIN_TS, safeDate, safeDay, getLastNDates, toUTCDateString, buildCalendar };