const { getLCStats, getLCRatingHistory } = require("./leetcode/lcService");
const { getLeetcodeSubmissionCalendar } = require("./leetcode/lcSubmissionsCalendar");
const { getCodeChefStats } = require("./codechef/codechefService");
const { getCodechefSubmissionCalendar } = require("./codechef/ccSubmissionsCalendar");
const { getCodeforcesSubmissionCalendar } = require("./codeforces/cfSubmissionsCalendar");
const { getCFStats } = require("./codeforces/cfService");
const { fetchRatingHistory: getCodeforcesRatingHistory } = require("./codeforces/cfRating");
const { getCodeforcesActivity, getCodeChefActivity, getLeetcodeActivity } = require("./activityService");
const { getGfgStats, getGfgSubmissionCalendar } = require("./geeksforgeeks/gfgService");
const { getAtcoderStats, getAtcoderRatingHistory, getAtcoderSubmissionCalendar } = require("./atcoder/atcoderService");

const platformServices = {
  codeforces: {
    stats: getCFStats,
    submissions: getCodeforcesSubmissionCalendar,
    rating: getCodeforcesRatingHistory,
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
  gfg: {
    stats: getGfgStats,
    submissions: getGfgSubmissionCalendar,
    rating: async () => [],
  },
  atcoder: {
    stats: getAtcoderStats,
    submissions: getAtcoderSubmissionCalendar,
    rating: getAtcoderRatingHistory,
  },
};

function getPlatformService(platform, type) {
  return platformServices[platform]?.[type];
}

module.exports = getPlatformService;
