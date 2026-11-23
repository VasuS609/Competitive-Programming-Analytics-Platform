const router = require("express").Router();

const {parseSubmissionDays} = require("../utils/helpers");

const { getCFAcceptedActivity } = require("../services/codeforces/cfTotalAccepted");
const { getCFNotAcceptedActivity } = require("../services/codeforces/cfNotAccepted");
const { getLCAcceptedActivity } = require("../services/leetcode/lcTotalAccepted");
const { getLastNDates} = require("../utils/dates");
//todo : lc not accepted is absent

const PLATFORM_LABELS = {
    codeforces: "Codeforces",
    leetcode: "Leetcode",
    github: "Github"
  };

  
async function getTotalAcceptedActivity(profiles, days){
    const dates = getLastNDates(days);
    const byDate = Object.fromEntries(
      dates.map((date) => [date, {date, submission: 0, accepted:0, nonAccepted : 0}])
    );

    const platformStatus = {}; //to remember which platform worked and which failed

    function track(platform, promise){
      return promise.then(
        () => {
          
          if(!platformStatus[platform]) platformStatus[platform] = {ok:true};
        },

        (error) =>{
          console.error(`[graphs] ${platform} failed:`, error?.message);
          platformStatus[platform] = {
            ok : false,
            error : `${PLATFORM_LABELS[platform]} is not responding`,
          };
        },
      )
    }

function merge(rows) {
    
  for (const row of rows) {
       if (!byDate[row.date]) continue;
        byDate[row.date].submissions += (row.submissions || 0);
        byDate[row.date].accepted += (row.accepted || 0);
        byDate[row.date].nonAccepted += (row.nonAccepted || 0);
      }
    }

    const tasks = [];

    if (profiles?.codeforces?.trim()) {
      const handle = profiles.codeforces.trim();

      tasks.push(
          track("codeforces", getCFAcceptedActivity(handle, days).then(merge)),
      track("codeforces", getCFNotAcceptedActivity(handle, days).then(merge)),
      );
    }

    if (profiles?.leetcode?.trim()) {
      tasks.push(
       track("leetcode", getLCAcceptedActivity(profiles.leetcode.trim(), days).then(merge)),
      );
    }

  if (profiles?.github?.trim()) {
    tasks.push(
      track(
    
        "github",
    
        require("../services/github/githubService")
          .getGithubDailyCommits(profiles.github.trim())
          .then((commitsByDay) => {
    
            for (const [date, count] of Object.entries(commitsByDay)) {
              if (!byDate[date]) continue;
              byDate[date].submissions += count;
              byDate[date].accepted += count;
            }
    
          }),
      ),
    );
  }

  await Promise.all(tasks);

  return { daily: dates.map((date) => byDate[date]), platformStatus };


}

router.post("/total-accepted", async (req, res, next) => {
  try {
    const days = parseSubmissionDays(req.body?.days);

    return res.json(await getTotalAcceptedActivity(req.body?.profiles, days));

  } catch (error) {
    
    return next({
      status: error.status || 502,
      message: error.message || "Failed to fetch accepted activity",
    });
  }
});

module.exports = router;
