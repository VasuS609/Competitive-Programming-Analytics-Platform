// Platform registry — add a platform back by importing its services here and
// adding one entry to PLATFORM_REGISTRY below.
const { getLCStats } = require("./leetcode/lcService");
const { getLeetcodeSubmissionCalendar } = require("./leetcode/lcSubmissionsCalendar");
const { getLCRatingHistory } = require("./leetcode/lcRating");
const { getLeetcodeActivity } = require("./activityService");

const { getCodeforcesSubmissionCalendar } = require("./codeforces/cfSubmissionsCalendar");
const { getCFStats } = require("./codeforces/cfService");
const { fetchRatingHistory: getCodeforcesRatingHistory } = require("./codeforces/cfRating");
const { getCodeforcesActivity } = require("./activityService");

const { getGithubStats, getGithubSubmissionCalendar } = require("./github/githubService");
const { getGithubActivity } = require("./activityService");

// PLATFORM_REGISTRY is the single source of truth for supported platforms.
// Each entry maps service-type strings ("stats", "submissions", "rating",
// "activity") to the function that handles that type for the platform.
// CodeChef, GFG and AtCoder have been temporarily removed because they
// returned incorrect data; re-add them here once their services are fixed.
const PLATFORM_REGISTRY = {
  codeforces: {
    stats: getCFStats,
    submissions: getCodeforcesSubmissionCalendar,
    rating: getCodeforcesRatingHistory,
    activity: getCodeforcesActivity,
  },
  leetcode: {
    stats: getLCStats,
    submissions: getLeetcodeSubmissionCalendar,
    rating: getLCRatingHistory,
    activity: getLeetcodeActivity,
  },
  github: {
    stats: getGithubStats,
    submissions: getGithubSubmissionCalendar,
    activity: getGithubActivity,
    rating: async () => [],
  },
};

function getPlatformService(platform, type) {
  return PLATFORM_REGISTRY[platform]?.[type];
}

/** Returns the set of registered platform names. */
function getSupportedPlatforms() {
  return new Set(Object.keys(PLATFORM_REGISTRY));
}

module.exports = { getPlatformService, getSupportedPlatforms, PLATFORM_REGISTRY };
