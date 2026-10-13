const { getLCStats, getLCRatingHistory } = require('../../services/leetcode/lcService');
const { getLeetcodeSubmissionCalendar } = require('../../services/leetcode/lcSubmissionsCalendar');
const { getCodeChefStats } = require('../../services/codechef/codechefService');
const { getCodechefSubmissionCalendar } = require('../../services/codechef/ccSubmissionsCalendar');
const { getCodeforcesSubmissionCalendar } = require('../../services/codeforces/cfSubmissionsCalendar');
const { getCFStats, fetchRatingHistory } = require('../../services/codeforces/cfService');
const { getGfgStats, getGfgSubmissionCalendar } = require('../../services/geeksforgeeks/gfgService');
const { getGithubStats, getGithubSubmissionCalendar } = require('../../services/github/githubService');
const {
  getAtcoderStats,
  getAtcoderRatingHistory,
  getAtcoderSubmissionCalendar,
} = require('../../services/atcoder/atcoderService');

const platformServices = {
  codeforces: {
    stats: getCFStats, //stats
    submissions: getCodeforcesSubmissionCalendar, //submissions
    rating: async (handle) => fetchRatingHistory(handle), //and rating
  },
  codechef: {
    stats: getCodeChefStats,
    submissions: getCodechefSubmissionCalendar,
    rating: async (handle) => {
      const data = await getCodeChefStats(handle); //3rd party api
      return normalizeCodeChefRating(data.ratingData);
    },
  },
  leetcode: {
    stats: getLCStats,
    submissions: getLeetcodeSubmissionCalendar,
    rating: getLCRatingHistory,
  },
  gfg: {
    stats: getGfgStats,
    submissions: getGfgSubmissionCalendar,
    rating: async () => [],
  },
  github: {
    stats: getGithubStats,
    submissions: getGithubSubmissionCalendar,
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
