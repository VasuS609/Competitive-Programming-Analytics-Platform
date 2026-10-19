const { getLCStats, getLCRatingHistory } = require("./leetcode/lcService");
const { getLeetcodeSubmissionCalendar } = require("./leetcode/lcSubmissionsCalendar");
const { getCodeChefStats } = require("./codechef/codechefService");
const { getCodeChefRatingHistory } = require("./codechef/ccRating");
const { getCodechefSubmissionCalendar } = require("./codechef/ccSubmissionsCalendar");
const { getCodeforcesSubmissionCalendar } = require("./codeforces/cfSubmissionsCalendar");
const { getCFStats } = require("./codeforces/cfService");
const { fetchRatingHistory: getCodeforcesRatingHistory } = require("./codeforces/cfRating");
const { getCodeforcesActivity, getCodeChefActivity, getLeetcodeActivity } = require("./activityService");
const { getGfgStats, getGfgSubmissionCalendar } = require("./geeksforgeeks/gfgService");
const { getAtcoderStats, getAtcoderRatingHistory, getAtcoderSubmissionCalendar } = require("./atcoder/atcoderService");
const { getAtcoderRatingHistory: getSeparatedAtcoderRatingHistory } = require("./atcoder/atRating");
const { getLCRatingHistory: getSeparatedLCRatingHistory } = require("./leetcode/lcRating");

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
    rating: getCodeChefRatingHistory,
    activity: getCodeChefActivity,
  },
  leetcode: {
    stats: getLCStats,
    submissions: getLeetcodeSubmissionCalendar,
    rating: getSeparatedLCRatingHistory,
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
    rating: getSeparatedAtcoderRatingHistory,
  },
};

function getPlatformService(platform, type) {
  return platformServices[platform]?.[type];
}

module.exports = getPlatformService;
