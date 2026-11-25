const test = require("node:test");
const assert = require("node:assert/strict");
const { dsaScore } = require("../services/metrics/dsaScore");
const { cpScore, ratingPoints } = require("../services/metrics/cpScore");
const { devScore } = require("../services/metrics/devScore");
const { activeDays, baselineMedian, calendarDays, weekly } = require("../services/metrics/weekly");

const range = { from: "2024-01-07", to: "2024-01-15", complete: true };
const sunday = Date.parse("2024-01-07T23:59:59Z") / 1000;
const monday = sunday + 1;
function lc(titleSlug, timestamp, difficulty, statusDisplay = "Accepted") {
  return { titleSlug, timestamp, difficulty, statusDisplay };
}
function cf(id, time, index, verdict, participantType, rating) {
  return { id, creationTimeSeconds: time, problem: { contestId: 12, index, rating },
    verdict, author: { participantType } };
}

test("LeetCode scores first observed accepts across the window boundary; failures only count as activity", () => {
  const rows = [lc("e", monday, "Easy"), lc("h", monday, "Hard"), lc("m", monday, "Medium"),
    lc("h", sunday, "Hard"), lc("old", sunday - 86400, "Hard"), lc("old", monday, "Hard"),
    lc("unknown", monday), lc("miss", monday + 86400, null, "Wrong Answer")];
  const result = dsaScore(rows, range);
  assert.deepEqual(result.daily.slice(0, 4).map(d => d.points), [6, 5, 0, null]);
  assert.equal(result.daily[1].solved, 3);
  assert.equal(result.daily[2].activeDay, true);
  assert.equal(result.unknownDifficulty, 1);
  assert.equal(result.coverage.complete, false);
  assert.equal(dsaScore(null, range).unknownDifficulty, null);
});

test("Codeforces rating bands include -200 and +200 in near, and +400 in stretch", () => {
  assert.deepEqual([799,800,1200,1201,1400,1401].map(r => ratingPoints(r,1000)), [0.5,1,1,2,2,3]);
  assert.equal(ratingPoints(null, 1500), 1);
  assert.equal(ratingPoints(1000, null), 1);
  assert.equal(ratingPoints(1700, 0), 1);
});

test("Codeforces recognizes practice and virtual upsolves, including pre-window contest attempts", () => {
  const rows = [cf(1,sunday-86400,"A","WRONG_ANSWER","CONTESTANT",1400),
    cf(2,sunday,"A","OK","PRACTICE",1400), cf(3,monday,"A","OK","PRACTICE",1400),
    cf(4,sunday,"B","WRONG_ANSWER","CONTESTANT"), cf(5,monday,"B","OK","VIRTUAL"),
    cf(6,sunday,"C","OK","CONTESTANT"), cf(7,monday,"C","OK","PRACTICE"),
    cf(8,monday,"D","OK","PRACTICE"), cf(9,monday+86400,"E","WRONG_ANSWER","PRACTICE")];
  const result = cpScore(rows.reverse(),1000,[],range);
  assert.equal(result.upsolved,2);
  assert.deepEqual(result.daily.slice(0,3).map(d => d.points),[3,2,0]);
  assert.equal(result.daily[2].activeDay,true);
  assert.deepEqual(result.weekly.map(w => [w.week,w.points]),[
    ["2024-01-01",3],["2024-01-08",2],["2024-01-15",0]]);
});

test("rating changes count once per contest, including contests earlier in the same month", () => {
  const entries = ["2023-07-31","2023-08-01","2024-01-01","2024-01-15","2024-01-16"]
    .map((date,contestId) => ({ date,contestId,newRating:1200+contestId }));
  const result = cpScore([],1200,[...entries,entries[2]],range);
  assert.deepEqual(result.contests,[{month:"2024-01",count:2}]);
  assert.deepEqual(result.ratingTrend.map(r => r.contestId),[1,2,3]);
  assert.equal(cpScore([],null,null,range).contests,null);
});

test("GitHub caps commits per UTC day across repos; reports observed review/PR/issue contributions", () => {
  const rows = [["commit",4,"A"],["commit",4,"B"],["openedPR",2,"B"],["review",1,"C"],["issue",1,"A"]]
    .map(([type,count,repository]) => ({ type,count,repository,date:"2024-01-08" }));
  rows.push({type:"commit",count:2,repository:"C",date:"2024-01-09"});
  const result = devScore(rows,range);
  assert.equal(result.daily[1].points,14);
  assert.equal(result.daily[1].commit,8);
  assert.deepEqual([result.weekly[1].points,result.weekly[1].activeDays,result.weekly[1].repositories],[16,2,3]);
  assert.match(result.coverage.reason,/Merged PRs/);
});

test("empty, missing, and events-only inputs remain distinguishable", () => {
  assert.equal(cpScore([],null,[],range).weekly[1].points,0);
  assert.equal(cpScore(null,null,null,range).weekly[1].points,null);
  assert.equal(dsaScore([],range).weekly[1].points,null);
  const fallback = devScore(null,range,["2024-01-08"]);
  assert.equal(fallback.daily[1].points,null);
  assert.equal(fallback.daily[1].activeDay,true);
  assert.equal(fallback.daily[0].activeDay,null);
  assert.equal(fallback.weekly[1].repositories,null);
  assert.equal(fallback.coverage.complete,false);
  const union = activeDays(fallback.daily,cpScore([],null,[],range).daily);
  assert.equal(union[0].activeDay,null);
  assert.equal(union[1].activeDay,true);
});

test("one observed GitHub contribution can have known points but an unknown repository", () => {
  const result = devScore([{ date: "2024-01-07T23:59:59Z", type: "openedPR" }], range);
  assert.equal(result.daily[0].points, 3);
  assert.equal(result.weekly[0].activeDays, 1);
  assert.equal(result.weekly[0].repositories, null);
  assert.equal(result.weekly[1].repositories, 0);
});

test("baseline uses four to eight known full weeks before the current UTC week, including zero weeks", () => {
  const span = { from:"2023-10-30",to:"2024-01-09",complete:true };
  const weeks = weekly([...calendarDays(span).values()],span);
  weeks.forEach((w,i) => {w.points = i});
  assert.equal(baselineMedian(weeks,span.to),5.5);
  assert.equal(baselineMedian(weeks.slice(-2),span.to),null);
  assert.equal(baselineMedian(weeks.slice(-4),span.to),null);
  assert.equal(baselineMedian(weeks.slice(-5),span.to),7.5);
  assert.equal(baselineMedian([],span.to),null);
  const zeros = weeks.map(w => ({...w,points:0}));
  assert.equal(baselineMedian(zeros,span.to),0);
  zeros.forEach(w => {w.complete=false});
  assert.equal(baselineMedian(zeros,span.to),null);
});
