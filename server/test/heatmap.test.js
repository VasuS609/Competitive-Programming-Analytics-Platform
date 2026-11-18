const test = require("node:test");
const assert = require("node:assert/strict");
const { getHeatmap, getRange, parseMonths, buildHeatmap, levelFor } = require("../services/heatmapService");

const now = new Date("2026-11-13T10:00:00Z");

test("range is whole calendar months ending today", () => {
  assert.deepEqual(getRange(3, now), { months: 3, from: "2026-09-01", to: "2026-11-13" });
  assert.deepEqual(getRange(1, now), { months: 1, from: "2026-11-01", to: "2026-11-13" });
});

test("groups activity and reports failed platforms", async () => {
  const fetchers = {
    codeforces: async () => ({ "2026-11-10": 3 }),
    github: async () => ({ "2026-11-13": 2 }),
    leetcode: async () => { throw new Error("LeetCode down"); },
  };
  const result = await getHeatmap({ codeforces: "a", github: "b", leetcode: "c" }, 3, { fetchers, now });
  assert.deepEqual(result.totals, { cp: 3, dsa: 0, dev: 2, total: 5 });
  assert.deepEqual(result.errors, { leetcode: "LeetCode down" });
  assert.deepEqual(result.loaded, ["codeforces", "github"]);
  assert.equal(result.daily.length, 30 + 31 + 13);
});

test("parseMonths clamps and defaults", () => {
  assert.equal(parseMonths(undefined), 3);
  assert.equal(parseMonths("0"), 1);
  assert.equal(parseMonths("99"), 12);
});

test("day with no events produces count 0, is level 0, and is not counted as active", () => {
  const range = { from: "2026-11-01", to: "2026-11-03", months: 1 };
  const countsByPlatform = {
    codeforces: { "2026-11-01": 5 },
  };
  const result = buildHeatmap(countsByPlatform, range);

  // Exactly 1 active day out of 3 days
  assert.equal(result.activeDays, 1);
  assert.equal(result.daily.length, 3);

  // Day with events
  const dayWithEvents = result.daily.find((d) => d.date === "2026-11-01");
  assert.equal(dayWithEvents.total, 5);

  // Day with no events
  const dayEmpty = result.daily.find((d) => d.date === "2026-11-02");
  assert.equal(dayEmpty.total, 0);
  assert.equal(dayEmpty.cp, 0);
  assert.equal(dayEmpty.dsa, 0);
  assert.equal(dayEmpty.dev, 0);
  assert.deepEqual(dayEmpty.platforms, {});

  // Assert level is 0 and not counted as active
  const max = Math.max(1, ...result.daily.map((d) => d.total));
  assert.equal(levelFor(dayEmpty.total, max), 0);
  assert.equal(dayEmpty.total > 0, false);
});
