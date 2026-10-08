const router = require("express").Router();
const { addProblem, getProblemsByDate, getGoalProgress } = require("../services/goals/problemService");

router.post("/problems", (req, res, next) => {
  try {
    const { date, name, url, rating, source, tags } = req.body || {};
    if (!date || !name || !url || rating === undefined || !source || tags === undefined) {
      return res.status(400).json({ error: "Missing required fields: date, name, url, rating, source, and tags are required." });
    }

    const problem = { date, name, url, rating, source, tags };
    addProblem(problem);
    return res.status(201).json({ message: "Problem added successfully", data: problem });
  } catch (error) {
    return next(error);
  }
});

router.get("/problems/:date", (req, res, next) => {
  try {
    return res.json(getProblemsByDate(req.params.date));
  } catch (error) {
    return next(error);
  }
});

router.get("/goal/:date", (req, res, next) => {
  try {
    return res.json(getGoalProgress(req.params.date));
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
