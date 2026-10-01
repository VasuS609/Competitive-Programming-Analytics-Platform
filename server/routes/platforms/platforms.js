const router = require("express").Router();
const getPlatformService = require("./getPlatformServices");
const { parseSubmissionDays, normalizeStats } = require("../utils/helpers");

router.get("/:platform/stats/:handle", async (req, res, next) => {

  const platform = req.params.platform.toLowerCase();
  const service = getPlatformService(platform, "stats");
  
  if (!service) return res.status(404).json({ error: `Platform '${platform}' is not supported` });

  try {
    const data = await service(req.params.handle);
    res.json(normalizeStats(platform, data, req.params.handle));
  } catch (e) {
    next({ status: e.status || 502, message: e.message });
  }
});

router.get("/:platform/submissions/:handle", async (req, res, next) => {

  const platform = req.params.platform.toLowerCase();
  const service = getPlatformService(platform, "submissions");

  if (!service) return res.status(404).json({ error: `Platform '${platform}' is not supported` });

  try {
    const days = parseSubmissionDays(req.query.days);
    res.json(await service(req.params.handle, days));
  } catch (e) {
    next({ status: 502, message: e.message });
  }
});


router.get("/:platform/activity/:handle", async (req, res, next) => {

  const platform = req.params.platform.toLowerCase();
  const service = getPlatformService(platform, "activity");

  if (!service) return res.status(404).json({ error: `Activity not supported for '${platform}'` });

  try {
    const days = parseSubmissionDays(req.query.days);
    res.json(await service(req.params.handle, days));
  } catch (e) {
    next({ status: 502, message: e.message });
  }
});


module.exports = router;