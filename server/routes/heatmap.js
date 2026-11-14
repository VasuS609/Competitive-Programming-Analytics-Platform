const router = require("express").Router();
const { getHeatmap, parseMonths, PLATFORMS } = require("../services/heatmapService");

router.get("/", async (req, res, next) => {
  try {
    const handles = Object.fromEntries(
      PLATFORMS.map((platform) => [platform, String(req.query[platform] ?? "").trim().slice(0, 40)]),
    );
    return res.json(await getHeatmap(handles, parseMonths(req.query.months)));
  } catch (error) {
    return next({ status: error.status || 502, message: error.message || "Failed to build activity heatmap" });
  }
});

module.exports = router;
