const { getLCStats, getLCRatingHistory } = require('../../services/leetcode/lcService');
const { getLeetcodeSubmissionCalendar } = require('../../services/leetcode/lcSubmissionsCalendar');

const { getCodeforcesSubmissionCalendar } = require('../../services/codeforces/cfSubmissionsCalendar');
const { getCFStats, fetchRatingHistory } = require('../../services/codeforces/cfService');
const { getGithubStats, getGithubSubmissionCalendar } = require('../../services/github/githubService');

const platformServices = {
  codeforces: {
    stats: getCFStats, //stats
    submissions: getCodeforcesSubmissionCalendar, //submissions
    rating: async (handle) => fetchRatingHistory(handle), //and rating
  },
  leetcode: {
    stats: getLCStats,
    submissions: getLeetcodeSubmissionCalendar,
    rating: getLCRatingHistory,
  },
  github: {
    stats: getGithubStats,
    submissions: getGithubSubmissionCalendar,
    rating: async () => [],
  }
};

function getPlatformService(platform, type) {
  return platformServices[platform]?.[type];
}

module.exports = getPlatformService;
