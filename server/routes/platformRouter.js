const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const { getPlatformService } = require("../services/platformServices");
const { parseSubmissionDays, normalizeStats } = require("../utils/helpers");
const { syncPlatform } = require("../services/platformSyncService");
const { validateHandleMiddleware } = require("../utils/validateHandle");

function platformName(req) {
  return req.params.platform.toLowerCase();
}

const syncRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  message: { error: "Too many sync requests; please wait a minute before retrying." },
});

// Per-handle cooldown: reject if the same handle was synced within 60 seconds.
const syncCooldown = new Map(); // key: `platform:handle` → timestamp
const SYNC_COOLDOWN_MS = 60 * 1000;

function checkSyncCooldown(req, res, next) {
  const key = `${platformName(req)}:${req.params.handle}`;
  const last = syncCooldown.get(key) || 0;
  if (Date.now() - last < SYNC_COOLDOWN_MS) {
    const retryAfter = Math.ceil((SYNC_COOLDOWN_MS - (Date.now() - last)) / 1000);
    return res.status(429).json({
      error: `This handle was synced recently. Please wait ${retryAfter}s before syncing again.`,
    });
  }
  next();
}

router.get("/:platform/stats/:handle", validateHandleMiddleware, async (req, res, next) => {
  const platform = platformName(req);
  const service = getPlatformService(platform, "stats");
  if (!service) return res.status(404).json({ error: `Platform '${platform}' is not supported` });

  try {
    const data = await service(req.params.handle);
    return res.json(normalizeStats(platform, data, req.params.handle));
  } catch (error) {
    return next({ status: error.status || 502, message: error.message || "Failed to fetch platform stats" });
  }
});

router.get("/:platform/submissions/:handle", validateHandleMiddleware, async (req, res, next) => {
  const platform = platformName(req);
  const service = getPlatformService(platform, "submissions");
  if (!service) return res.status(404).json({ error: `Platform '${platform}' is not supported` });

  try {
    return res.json(await service(req.params.handle, parseSubmissionDays(req.query.days)));
  } catch (error) {
    return next({ status: error.status || 502, message: error.message || "Failed to fetch submission history" });
  }
});

router.get("/:platform/rating/:handle", validateHandleMiddleware, async (req, res, next) => {
  const platform = platformName(req);
  const service = getPlatformService(platform, "rating");
  if (!service) return res.status(404).json({ error: `Rating not supported for '${platform}'` });

  try {
    return res.json(await service(req.params.handle));
  } catch (error) {
    return next({ status: error.status || 502, message: error.message || "Failed to fetch rating history" });
  }
});

router.get("/:platform/activity/:handle", validateHandleMiddleware, async (req, res, next) => {
  const platform = platformName(req);
  const service = getPlatformService(platform, "activity");
  if (!service) return res.status(404).json({ error: `Activity not supported for '${platform}'` });

  try {
    return res.json(await service(req.params.handle, parseSubmissionDays(req.query.days)));
  } catch (error) {
    return next({ status: error.status || 502, message: error.message || "Failed to fetch activity" });
  }
});

router.post(
  "/:platform/sync/:handle",
  syncRateLimit,
  validateHandleMiddleware,
  checkSyncCooldown,
  async (req, res, next) => {
    const key = `${platformName(req)}:${req.params.handle}`;
    try {
      const result = await syncPlatform(req.params.handle, req.params.platform);
      syncCooldown.set(key, Date.now());
      return res.json(result);
    } catch (error) {
      return next({
        status: error.status || 502,
        message: error.message || "Failed to sync platform data",
      });
    }
  },
);

module.exports = router;
