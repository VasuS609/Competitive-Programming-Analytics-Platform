const { getCFAcceptedActivity } = require("./cfTotalAccepted");
const { getCFNotAcceptedActivity } = require("./cfNotAccepted");
const { getLastNDates } = require("../../utils/dates");

async function getCodeforcesSubmissionCalendar(handle, days = 7) {
  const [accepted, notAccepted] = await Promise.all([
    getCFAcceptedActivity(handle, days),
    getCFNotAcceptedActivity(handle, days),
  ]);

  const byDate = Object.fromEntries(getLastNDates(days).map((date) => [date, 0]));

  for (const row of [...accepted, ...notAccepted]) 
    byDate[row.date] = (byDate[row.date] || 0) + row.submissions;
  
  return Object.entries(byDate).map(([date, count]) => ({ date, count }));
}

module.exports = { getCodeforcesSubmissionCalendar };
