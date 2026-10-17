const router = require("express").Router();
const { getTotalAcceptedActivity } = require("../services/graphs/totalAccepted");

router.post("/total-accepted", async (req, res, next) => {
  try {
    return res.json(await getTotalAcceptedActivity(req.body?.profiles, 7));
  } catch (error) {
    return next({
      status: error.status || 502,
      message: error.message || "Failed to fetch accepted activity",
    });
  }
});

module.exports = router;
