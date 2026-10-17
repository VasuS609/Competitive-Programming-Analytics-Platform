const getPlatformService = require("./platformServices");
const { getSolvedProblems } = require("./solvedProblemService");

const SUPPORTED_PLATFORMS = new Set([
  "codeforces",
  "codechef",
  "leetcode",
  "gfg",
  "atcoder",
]);

async function syncPlatform(handle, platform) {
  const normalizedPlatform = String(platform).trim().toLowerCase();
  const normalizedHandle = String(handle).trim();

  if (!SUPPORTED_PLATFORMS.has(normalizedPlatform)) {
    const error = new Error(`Platform '${normalizedPlatform}' is not supported`);
    error.status = 404;
    throw error;
  }

  if (!normalizedHandle) {
    const error = new Error("A platform handle is required");
    error.status = 400;
    throw error;
  }

  const statsService = getPlatformService(normalizedPlatform, "stats");
  if (!statsService) {
    const error = new Error(`Stats are not supported for '${normalizedPlatform}'`);
    error.status = 404;
    throw error;
  }

  const stats = await statsService(normalizedHandle);
  const problems = getSolvedProblems(normalizedPlatform, normalizedHandle);

  return {
    platform: normalizedPlatform,
    handle: normalizedHandle,
    syncedCount: problems.length,
    totalSolved: stats.problemSolved ?? stats.totalSolved ?? problems.length,
    problems,
    syncedAt: new Date().toISOString(),
  };
}

module.exports = { syncPlatform };
