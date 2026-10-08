const { getLCStats, getLCRatingHistory } = require("./leetcode/lcService");
const { getLeetcodeSubmissionCalendar } = require("./leetcode/lcSubmissionsCalendar");
const { getCodeChefStats } = require("./codechef/codechefService");
const { getCodechefSubmissionCalendar } = require("./codechef/ccSubmissionsCalendar");
const { getCodeforcesSubmissionCalendar } = require("./codeforces/cfSubmissionsCalendar");
const { getCFStats, fetchRatingHistory } = require("./codeforces/cfService");
const { getCodeforcesActivity, getCodeChefActivity, getLeetcodeActivity } = require("./activityService");

const platformServices = {
  codeforces: {
    stats: getCFStats,
    submissions: getCodeforcesSubmissionCalendar,
    rating: fetchRatingHistory,
    activity: getCodeforcesActivity,
  },
  codechef: {
    stats: getCodeChefStats,
    submissions: getCodechefSubmissionCalendar,
    rating: async (handle) => (await getCodeChefStats(handle)).ratingData || [],
    activity: getCodeChefActivity,
  },
  leetcode: {
    stats: getLCStats,
    submissions: getLeetcodeSubmissionCalendar,
    rating: getLCRatingHistory,
    activity: getLeetcodeActivity,
  },
};

function getPlatformService(platform, type) {
  return platformServices[platform]?.[type];
}

module.exports = getPlatformService;
