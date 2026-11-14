const { toUTCDateString, getLastNDates } = require("../../utils/dates");

const CACHE_TTL = 10 * 60 * 1000;
const cache = {};
const IGNORED_RESULTS = new Set(["CE", "WJ", "WR", "IE"]);

async function fetchAtcoderSubmissions(handle, fromSecond) {
  const key = `${String(handle).trim().toLowerCase()}:${fromSecond}`;
  const hit = cache[key];
  if (hit && Date.now() < hit.expiresAt) return hit.rows;
  const response = await fetch(`https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${encodeURIComponent(handle)}&from_second=${fromSecond}`);
  if (!response.ok) throw new Error(`AtCoder Problems API Error ${response.status}`);
  const rows = await response.json();
  const list = Array.isArray(rows) ? rows : [];
  cache[key] = { rows: list, expiresAt: Date.now() + CACHE_TTL };
  return list;
}

function buildAtcoderDaily(rows) {
  const byDate = {};
  for (const row of rows) {
    if (IGNORED_RESULTS.has(row.result)) continue;
    const date = toUTCDateString(Number(row.epoch_second) * 1000);
    if (!date) continue;
    const entry = byDate[date] || (byDate[date] = { submissions: 0, accepted: 0, nonAccepted: 0 });
    entry.submissions += 1;
    if (row.result === "AC") entry.accepted += 1;
    else entry.nonAccepted += 1;
  }
  return Object.entries(byDate).map(([date, entry]) => ({ date, ...entry }));
}

async function getAtcoderDailyStats(handle, days = 7) {
  const [from] = getLastNDates(days);
  const fromSecond = Math.floor(Date.parse(`${from}T00:00:00Z`) / 1000);
  return buildAtcoderDaily(await fetchAtcoderSubmissions(handle, fromSecond));
}

module.exports = { fetchAtcoderSubmissions, buildAtcoderDaily, getAtcoderDailyStats };
