const { getAtcoderData } = require("./atcoderService");
async function getAtcoderAcceptedActivity(handle) {
  const data = await getAtcoderData(handle);
  return (data.contests || []).map((contest) => ({
    date: new Date(contest.contestEndTime).toISOString().slice(0, 10),
    submissions: 1,
    accepted: null,
    nonAccepted: null,
    contestId: contest.contestId || null,
    questionName: null,
    records: [],
  }));
}
module.exports = { getAtcoderAcceptedActivity };
