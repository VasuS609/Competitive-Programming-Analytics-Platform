const { fetchJson } = require("../../utils/httpClient");
const { createTtlCache } = require("../../utils/ttlCache");
const { handleKey } = require("../../utils/helpers");
const { safeDay } = require("../../utils/dates");
const { github } = require("../metrics/config");

const connections = {
  openedPR: ["pullRequestContributions", "pullRequest"],
  review: ["pullRequestReviewContributions", "pullRequest"],
  issue: ["issueContributions", "issue"],
};
const pageInfo = "pageInfo { hasNextPage endCursor }";
function connectionField(type, after = "") {
  const [field, item] = connections[type];
  return `${type}: ${field}(first: $first${after}) {
    nodes { occurredAt item: ${item} { id repository { id } } }
    ${pageInfo}
  }`;
}

async function queryCollection(token, variables, fields, paging = false) {
  const query = `query Progress($login: String!, $from: DateTime!, $to: DateTime!, $first: Int!${paging ? ", $after: String!" : ""}) {
    user(login: $login) { contributionsCollection(from: $from, to: $to) { ${fields} } }
  }`;
  const response = await fetchJson("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const collection = response?.data?.user?.contributionsCollection;
  if (response?.errors?.length || !collection) throw new Error("GitHub contribution query failed");
  return collection;
}

function contributionDay(node) {
  const day = safeDay(Date.parse(node?.occurredAt) / 1000);
  if (!day) throw new Error("Invalid GitHub contribution date");
  return day;
}

function checkPage(page) {
  if (!Array.isArray(page?.nodes) || typeof page.pageInfo?.hasNextPage !== "boolean") {
    throw new Error("Invalid GitHub contribution page");
  }
}

async function fetchContributions(handle, range, token) {
  const variables = {
    login: handle, from: range.from + "T00:00:00Z", to: range.to + "T23:59:59.999Z",
    first: github.pageSize,
  };
  const fields = `
    restrictedContributionsCount totalRepositoriesWithContributedCommits totalCommitContributions
    commitContributionsByRepository(maxRepositories: ${github.maxRepositories}) {
      repository { id }
      contributions(first: $first) { nodes { occurredAt commitCount } ${pageInfo} }
    }
    ${Object.keys(connections).map(type => connectionField(type)).join("\n")}
  `;
  const data = await queryCollection(token, variables, fields);
  const groups = data.commitContributionsByRepository;
  if (!Array.isArray(groups) || ![data.totalCommitContributions, data.restrictedContributionsCount,
    data.totalRepositoriesWithContributedCommits].every(n => Number.isSafeInteger(n) && n >= 0)) {
    throw new Error("Invalid GitHub contribution totals");
  }
  const rows = [];
  const limits = [];
  let commits = 0;
  for (const group of groups) {
    checkPage(group.contributions);
    // One commit bucket per repository per day. The API range is at most 12 weeks.
    if (group.contributions.pageInfo.hasNextPage) limits.push("Commit detail was truncated.");
    for (const node of group.contributions.nodes) {
      if (!Number.isSafeInteger(node?.commitCount) || node.commitCount < 0 || !group.repository?.id) {
        throw new Error("Invalid GitHub commit contribution");
      }
      commits += node.commitCount;
      rows.push({ date: contributionDay(node), type: "commit", count: node.commitCount, repository: group.repository.id });
    }
  }
  if (groups.length < data.totalRepositoriesWithContributedCommits || commits < data.totalCommitContributions) {
    limits.push("Some commit contributions were outside the returned repository groups.");
  }
  if (data.restrictedContributionsCount) limits.push("Private contribution details are unavailable.");

  for (const type of Object.keys(connections)) {
    let page = data[type];
    const cursors = new Set();
    const seen = new Set();
    while (true) {
      checkPage(page);
      for (const node of page.nodes) {
        if (!node?.item?.id || !node.item.repository?.id) throw new Error("Invalid GitHub contribution");
        if (seen.has(node.item.id)) continue;
        seen.add(node.item.id);
        rows.push({ date: contributionDay(node), type, repository: node.item.repository.id });
      }
      if (!page.pageInfo.hasNextPage) break;
      const after = page.pageInfo.endCursor;
      if (!after || cursors.has(after)) throw new Error("Invalid GitHub pagination cursor");
      cursors.add(after);
      const next = await queryCollection(token, { ...variables, after }, connectionField(type, ", after: $after"), true);
      page = next[type];
    }
  }
  return { rows, complete: !limits.length, reason: [...new Set(limits)].join(" ") };
}

let cache = createTtlCache();
let cacheToken;
function getGithubContributions(handle, range) {
  const token = process.env.GITHUB_TOKEN?.trim();
  if (!token) throw new Error("GitHub token unavailable");
  if (cacheToken !== token) {
    cache = createTtlCache();
    cacheToken = token;
  }
  const login = handle.trim();
  const key = JSON.stringify([handleKey(login), range.from, range.to]);
  return cache.get(key, () => fetchContributions(login, range, token));
}

module.exports = { getGithubContributions };
