const cache = {};

const CACHE_TTL = 10 * 60 * 1000;

async function fetchJson(url) {

  const response = await fetch(url);

  if (!response.ok) throw new Error(`Codeforces API Error ${response.status}`);

  return response.json();
}

function getLastSevenDates() {
  const dates = [];

  const today = new Date();

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(today);

    date.setDate(today.getDate() - offset);
    dates.push(date.toISOString().slice(0, 10));
  }

  return dates;
}

async function getCodeforcesSubmissionCalendar(handle) {
  const cached = cache[handle];

  if (cached && Date.now() < cached.expiresAt) return cached.data;

  const dates = getLastSevenDates();
  const counts = Object.fromEntries(dates.map((date) => [date, 0]));

  const response = await fetchJson(`https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}`);

  response.result.forEach((submission) => {
    const date = new Date(submission.creationTimeSeconds * 1000).toISOString().slice(0, 10);

    if (date in counts) counts[date] += 1;
  });

  const data = dates.map((date) => ({ date, count: counts[date] }));

  cache[handle] = { data, expiresAt: Date.now() + CACHE_TTL };

  return data;
}

module.exports = { getCodeforcesSubmissionCalendar };