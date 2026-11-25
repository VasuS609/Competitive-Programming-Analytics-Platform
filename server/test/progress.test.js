const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const app = require("../index");
const { LeetCode, Credential } = require("leetcode-query");
const { safeDay } = require("../utils/dates");

let server;
before(async () => {
  server = http.createServer(app);
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
});
after(() => new Promise(resolve => server.close(resolve)));

function post(body) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      host: "127.0.0.1", port: server.address().port, path: "/api/metrics/progress",
      method: "POST", headers: { "Content-Type": "application/json" },
    }, res => {
      let text = "";
      res.setEncoding("utf8");
      res.on("data", chunk => { text += chunk; });
      res.on("end", () => resolve({ code: res.statusCode, data: JSON.parse(text) }));
    });
    req.on("error", reject);
    req.end(JSON.stringify(body));
  });
}

function setToken(t, value) {
  const prior = process.env.GITHUB_TOKEN;
  if (value) process.env.GITHUB_TOKEN = value;
  else delete process.env.GITHUB_TOKEN;
  t.after(() => {
    if (prior === undefined) delete process.env.GITHUB_TOKEN;
    else process.env.GITHUB_TOKEN = prior;
  });
}

const page = (nodes = [], endCursor = null) => ({
  nodes, pageInfo: { hasNextPage: endCursor !== null, endCursor },
});
const timestamp = Math.floor(Date.now() / 1000);
const day = safeDay(timestamp);
const date = day + "T00:00:00Z";
const entry = id => ({ occurredAt: date, item: { id, repository: { id: "R" } } });
const collection = values => Response.json({ data: { user: { contributionsCollection: values } } });

test("valid progress request uses original handles, paginates GitHub and reuses cached data", async t => {
  setToken(t, "fixture-only-token");
  let graphqlCalls = 0;
  let cfSubmissions = 0;
  t.mock.method(Credential.prototype, "init", async () => {});
  t.mock.method(LeetCode.prototype, "user", async handle => {
    assert.equal(handle, "MixedLC");
    return { matchedUser: {}, recentSubmissionList: [
      { titleSlug: "fixture", statusDisplay: "Accepted", timestamp, difficulty: "Hard" },
    ] };
  });
  t.mock.method(LeetCode.prototype, "graphql", async () => ({}));
  t.mock.method(LeetCode.prototype, "user_contest_info", async () => null);
  t.mock.method(globalThis, "fetch", async (url, options) => {
    if (url === "https://api.github.com/graphql") {
      graphqlCalls++;
      const { query, variables } = JSON.parse(options.body);
      assert.equal(variables.login, "MixedGH");
      assert.equal(options.method, "POST");
      assert.equal(options.headers.Authorization, "Bearer fixture-only-token");
      if (variables.after) {
        assert.equal(variables.after, "next");
        assert.match(query, /after: \$after/);
        return collection({ openedPR: page([entry("PR2")]) });
      }
      return collection({
        restrictedContributionsCount: 0, totalRepositoriesWithContributedCommits: 1,
        totalCommitContributions: 7, commitContributionsByRepository: [{
          repository: { id: "R" }, contributions: page([{ occurredAt: date, commitCount: 7 }]),
        }],
        openedPR: page([entry("PR1")], "next"), issue: page([entry("I")]), review: page([entry("PR1")]),
      });
    }
    assert.match(url, /MixedCF/);
    if (url.includes("user.status")) {
      cfSubmissions++;
      return Response.json({ status: "OK", result: [{ id: 1, creationTimeSeconds: timestamp,
        verdict: "OK", author: { participantType: "PRACTICE" }, problem: { contestId: 1, index: "A", rating: 1600 } }] });
    }
    if (url.includes("user.rating")) return Response.json({ status: "OK", result: [] });
    assert.match(url, /user.info/);
    return Response.json({ status: "OK", result: [{ handle: "MixedCF", rating: 1300 }] });
  });
  const { code, data } = await post({ profiles: { github: " MixedGH ", codeforces: " MixedCF ", leetcode: " MixedLC " } });
  assert.equal(code, 200);
  assert.equal(data.range.weeks, 8);
  assert.equal(data.range.to, day);
  assert.equal(new Date(data.range.from).getUTCDay(), 1);
  assert.deepEqual(data.platformStatus, { github: { ok: true }, codeforces: { ok: true }, leetcode: { ok: true } });
  assert.deepEqual([data.dsa, data.cp, data.dev].map(domain => domain.daily.at(-1).points), [6, 2, 14]);
  assert.equal(data.dev.weekly.at(-1).repositories, 1);
  assert.equal(data.dev.weekly.length, 8);
  assert.equal(data.activeDays.at(-1).activeDay, true);
  assert.ok(!JSON.stringify(data).includes("fixture-only-token"));
  const cached = await post({ profiles: { github: "mixedgh" } });
  assert.equal(cached.data.dev.daily.at(-1).points, 14);
  assert.equal(graphqlCalls, 2);
  assert.equal(cfSubmissions, 1);
});

test("invalid requests return clear 400s before any provider call", async () => {
  const cases = [[], {}, { profiles: null }, { profiles: [] }, { profiles: "name" },
    { profiles: { leetcode: 12 } }, { profiles: { github: "bad/handle" } },
    { profiles: { github: " " } }, { profiles: { other: "user" } },
    ...[0,13,1.5,"2",null].map(weeks => ({ profiles: {}, weeks }))];
  for (const body of cases) {
    const { code, data } = await post(body);
    assert.equal(code, 400);
    assert.equal(typeof data.error, "string");
    assert.ok(data.error.length);
  }
});

test("missing handles produce unavailable cards for both range boundaries", async () => {
  for (const weeks of [1, 12]) {
    const { code, data } = await post({ profiles: {}, weeks });
    assert.equal(code, 200);
    assert.deepEqual(data.platformStatus, {});
    assert.equal(data.cp.weekly.length, weeks);
    for (const domain of [data.dsa, data.cp, data.dev]) {
      assert.equal(domain.coverage.reason, "Connect your handle");
      assert.equal(domain.weekly.at(-1).points, null);
    }
    assert.equal(data.activeDays.at(-1).activeDay, null);
  }
});

test("a failed platform leaves event-only GitHub activity visible without a token", async t => {
  setToken(t, null);
  t.mock.method(globalThis, "fetch", async url => {
    if (url.includes("codeforces.com")) throw new Error("provider diagnostic");
    assert.match(url, /users\/EventUser\/events\/public/);
    return Response.json([{ type: "PushEvent", created_at: date }]);
  });
  const { code, data } = await post({ profiles: { github: "EventUser", codeforces: "DownCF" } });
  assert.equal(code, 200);
  assert.equal(data.cp.upsolved, null);
  assert.equal(data.platformStatus.codeforces.ok, false);
  assert.equal(data.platformStatus.github.ok, true);
  assert.equal(data.dev.coverage.reason, "No GitHub token configured / limited to about the last 90 days");
  assert.equal(data.dev.daily.at(-1).activeDay, true);
  assert.equal(data.dev.daily.at(-1).points, null);
  assert.doesNotMatch(JSON.stringify(data), /provider diagnostic/);
});

test("GitHub GraphQL errors use the fallback, keep failed status and are retried", async t => {
  setToken(t, "fixture-failure");
  let attempts = 0;
  t.mock.method(globalThis, "fetch", async url => {
    if (url.endsWith("/graphql")) {
      attempts++;
      return Response.json({ errors: [{ message: "private diagnostic" }] });
    }
    return Response.json([{ type: "PushEvent", created_at: date }]);
  });
  for (let i = 0; i < 2; i++) {
    const { data } = await post({ profiles: { github: "GraphFail" } });
    assert.equal(data.platformStatus.github.ok, false);
    assert.equal(data.dev.daily.at(-1).points, null);
    assert.equal(data.dev.daily.at(-1).activeDay, true);
    assert.match(data.dev.coverage.reason, /public push activity/);
    assert.doesNotMatch(JSON.stringify(data), /private diagnostic/);
  }
  assert.equal(attempts, 2);
});

test("repository caps and restricted GitHub records remain visible as incomplete coverage", async t => {
  setToken(t, "fixture-partial");
  t.mock.method(globalThis, "fetch", async () => collection({
    restrictedContributionsCount: 2, totalRepositoriesWithContributedCommits: 1,
    totalCommitContributions: 3, commitContributionsByRepository: [],
    openedPR: page(), issue: page(), review: page(),
  }));
  const { data } = await post({ profiles: { github: "Limited" } });
  assert.equal(data.dev.coverage.complete, false);
  assert.match(data.dev.coverage.reason, /repository groups/);
  assert.match(data.dev.coverage.reason, /Private/);
  assert.equal(data.dev.daily.at(-1).points, null);
  assert.equal(data.dev.weekly.at(-1).repositories, null);
});

test("a failed rating history preserves measurable Codeforces points", async t => {
  t.mock.method(globalThis, "fetch", async url => {
    if (url.includes("user.rating")) throw new Error("rating history failed");
    if (url.includes("user.status")) return Response.json({ status: "OK", result: [{
      id: 33, creationTimeSeconds: timestamp, verdict: "OK", problem: { contestId: 2, index: "B", rating: 1450 },
    }] });
    return Response.json({ status: "OK", result: [{ handle: "HistoryFail", rating: 1200 }] });
  });
  const { data } = await post({ profiles: { codeforces: "HistoryFail" } });
  assert.equal(data.cp.daily.at(-1).points, 2);
  assert.equal(data.cp.contests, null);
  assert.equal(data.cp.ratingTrend, null);
  assert.equal(data.platformStatus.codeforces.ok, false);
  assert.match(data.cp.coverage.reason, /history unavailable/);
});

test("missing token and failed events preserve both reasons, without inventing inactivity", async t => {
  setToken(t, null);
  t.mock.method(globalThis, "fetch", async () => { throw new Error("events failed"); });
  const { data } = await post({ profiles: { github: "EventsFail" } });
  assert.equal(data.platformStatus.github.ok, false);
  assert.match(data.dev.coverage.reason, /No GitHub token configured/);
  assert.match(data.dev.coverage.reason, /events are also unavailable/);
  assert.equal(data.dev.daily.at(-1).activeDay, null);
  assert.equal(data.dev.weekly.at(-1).points, null);
});
