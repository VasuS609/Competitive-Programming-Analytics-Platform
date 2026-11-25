const { before, after, test } = require("node:test");
const assert = require("node:assert/strict");
const { Credential, LeetCode } = require("leetcode-query");
const { getLastNDates } = require("../utils/dates");
const app = require("../index");

const localFetch = globalThis.fetch;
let server;
before(async () => {
  await new Promise(resolve => { server = app.listen(0, "127.0.0.1", resolve); });
});
after(() => new Promise(resolve => server.close(resolve)));

async function dailyGraph(profiles) {
  const url = `http://127.0.0.1:${server.address().port}/api/graphs/total-accepted`;
  const response = await localFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profiles, days: 1 }),
  });
  assert.equal(response.status, 200);
  return response.json();
}

function mockLeetcode(t, timestamp) {
  t.mock.method(Credential.prototype, "init", async () => {});
  t.mock.method(LeetCode.prototype, "user", async () => ({
    matchedUser: { submissionCalendar: JSON.stringify({ [timestamp]: 3 }) },
    recentSubmissionList: [],
  }));
  t.mock.method(LeetCode.prototype, "user_contest_info", async () => null);
  t.mock.method(LeetCode.prototype, "graphql", async () => ({}));
}

test("daily total combines CP and DSA attempts; verdict counts belong to Codeforces", async t => {
  const [date] = getLastNDates(1);
  const timestamp = Date.parse(date + "T00:00:00Z") / 1000;
  mockLeetcode(t, timestamp);
  const calls = t.mock.method(globalThis, "fetch", async () => Response.json({
    status: "OK",
    result: ["OK", "WRONG_ANSWER"].map(verdict => ({
      creationTimeSeconds: timestamp, verdict, problem: { contestId: 12, index: "A" },
    })),
  }));
  const result = await dailyGraph({ codeforces: "ChartCF", leetcode: "ChartLC", github: "ChartGH" });
  assert.deepEqual(result.daily, [{ date, submissions: 5, accepted: 1, nonAccepted: 1 }]);
  assert.deepEqual(result.platformStatus, { codeforces: { ok: true }, leetcode: { ok: true } });
  assert.equal(calls.mock.callCount(), 1);
  assert.match(calls.mock.calls[0].arguments[0], /codeforces\.com\/api\/user\.status/);
});

test("a Codeforces failure preserves the LeetCode total and marks verdict counts unavailable", async t => {
  const [date] = getLastNDates(1);
  mockLeetcode(t, Date.parse(date + "T00:00:00Z") / 1000);
  t.mock.method(globalThis, "fetch", async () => { throw new Error("Simulated provider failure"); });
  const result = await dailyGraph({ codeforces: "UnavailableCF", leetcode: "AvailableLC" });
  assert.deepEqual(result.daily, [{ date, submissions: 3, accepted: null, nonAccepted: null }]);
  assert.equal(result.platformStatus.codeforces.ok, false);
  assert.ok(result.platformStatus.codeforces.error);
  assert.equal(result.platformStatus.leetcode.ok, true);
});

test("a GitHub-only profile contributes no submissions and makes no provider request", async t => {
  const calls = t.mock.method(globalThis, "fetch", async () => { throw new Error("Unexpected fetch"); });
  const result = await dailyGraph({ github: "OnlyGitHub" });
  assert.equal(calls.mock.callCount(), 0);
  assert.deepEqual(result.platformStatus, {});
  assert.equal(result.daily[0].submissions, 0);
  assert.equal(result.daily[0].accepted, null);
});
