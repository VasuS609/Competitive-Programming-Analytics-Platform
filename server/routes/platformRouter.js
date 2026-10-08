const router = require("express").Router();
const getPlatformService = require("../services/platformServices");
const { parseSubmissionDays, normalizeStats } = require("../utils/helpers");

function platformName(req) {
  return req.params.platform.toLowerCase();
}

router.get("/:platform/stats/:handle", async (req, res, next) => {
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

router.get("/:platform/submissions/:handle", async (req, res, next) => {
  const platform = platformName(req);
  const service = getPlatformService(platform, "submissions");
  if (!service) return res.status(404).json({ error: `Platform '${platform}' is not supported` });

  try {
    return res.json(await service(req.params.handle, parseSubmissionDays(req.query.days)));
  } catch (error) {
    return next({ status: error.status || 502, message: error.message || "Failed to fetch submission history" });
  }
});

router.get("/:platform/rating/:handle", async (req, res, next) => {
  const platform = platformName(req);
  const service = getPlatformService(platform, "rating");
  if (!service) return res.status(404).json({ error: `Rating not supported for '${platform}'` });

  try {
    return res.json(await service(req.params.handle));
  } catch (error) {
    return next({ status: error.status || 502, message: error.message || "Failed to fetch rating history" });
  }
});

router.get("/:platform/activity/:handle", async (req, res, next) => {
  const platform = platformName(req);
  const service = getPlatformService(platform, "activity");
  if (!service) return res.status(404).json({ error: `Activity not supported for '${platform}'` });

  try {
    return res.json(await service(req.params.handle, parseSubmissionDays(req.query.days)));
  } catch (error) {
    return next({ status: error.status || 502, message: error.message || "Failed to fetch activity" });
  }
});

module.exports = router;
