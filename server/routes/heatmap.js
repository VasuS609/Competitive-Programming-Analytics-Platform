const router = require("express").Router();
const { getHeatmap, parseMonths, PLATFORMS } = require("../services/heatmapService");
const { validateHandle } = require("../utils/validateHandle");

router.get("/", async (req, res, next) => {
  try {
    // Validate each supplied platform handle; silently skip missing/invalid ones
    // so a single bad handle doesn't break heatmaps for the other platforms.
    const handles = {};

    for (const platform of PLATFORMS) {
      const raw = req.query[platform];
      if (!raw) continue;
      try {
        handles[platform] = validateHandle(String(raw));
      } catch {
        // Invalid handle for this platform — skip it.
      }
    }
    return res.json(await getHeatmap(handles, parseMonths(req.query.months)));
  } catch (error) {
    return next({ status: error.status || 502, message: error.message || "Failed to build activity heatmap" });
  }
});

module.exports = router;
