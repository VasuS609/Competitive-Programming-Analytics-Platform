const router = require("express").Router();
const { validateHandle } = require("../utils/validateHandle");
const { range } = require("../services/metrics/config");
const { getProgress } = require("../services/metrics/progress");

function plainObject(value) {
  return value !== null && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype;
}

router.post("/progress", async (req, res, next) => {
  if (!plainObject(req.body) || !plainObject(req.body.profiles)) {
    return next({ status: 400, message: "profiles must be a plain object" });
  }
  const { weeks = range.defaultWeeks, profiles } = req.body;
  if (!Number.isInteger(weeks) || weeks < range.minWeeks || weeks > range.maxWeeks) {
    return next({ status: 400, message: `weeks must be an integer from ${range.minWeeks} to ${range.maxWeeks}` });
  }
  const handles = {};
  for (const [platform, handle] of Object.entries(profiles)) {
    if (!["codeforces", "leetcode", "github"].includes(platform)) {
      return next({ status: 400, message: "Unsupported profile platform" });
    }
    handles[platform] = validateHandle(handle);
  }
  res.json(await getProgress(handles, weeks));
});

module.exports = router;
