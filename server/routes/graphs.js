const router = require("express").Router();
const { getTotalAcceptedActivity } = require("../services/graphs/totalAccepted");

router.post("/total-accepted", async (req, res, next) => {
  try {
    const requestedDays = Number(req.body?.days);
    const days = Number.isInteger(requestedDays) ? requestedDays : 7;
    return res.json(await getTotalAcceptedActivity(req.body?.profiles, days));
  } catch (error) {
    return next({
      status: error.status || 502,
      message: error.message || "Failed to fetch accepted activity",
    });
  }
});

module.exports = router;
