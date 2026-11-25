const { getPlatformService, getSupportedPlatforms } = require("./platformServices");

// TODO: Add per-user authentication before exposing sync to the public internet.
// Until then sync is protected only by the rate limiter + per-handle cooldown
// defined in index.js.

async function syncPlatform(handle, platform) {
  const normalizedPlatform = String(platform).trim().toLowerCase();
  const normalizedHandle = String(handle).trim();

  if (!getSupportedPlatforms().has(normalizedPlatform)) {
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

  // Pass forceRefresh so sync always fetches live data, bypassing any cache.
  const stats = await statsService(normalizedHandle, { forceRefresh: true });

  const { invalidateHeatmapCache } = require("./heatmapService");
  invalidateHeatmapCache(normalizedPlatform, normalizedHandle);

  const problems = stats.problems || [];

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
