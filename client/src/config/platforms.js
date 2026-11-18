/**
 * Single source of truth for the platforms the client UI advertises.
 * CodeChef, GFG and AtCoder are temporarily removed because their backend
 * services returned incorrect data. Re-add them here (and in the server's
 * platformServices.js) when their services are fixed.
 */
export const SUPPORTED_PLATFORMS = [
  { id: "codeforces", label: "Codeforces", color: "#e4572e" },
  { id: "leetcode",   label: "LeetCode",   color: "#f2c94c" },
  { id: "github",     label: "GitHub",     color: "#24292f" },
];

/** Platform ids as a plain array, e.g. for iteration and validation. */
export const PLATFORM_IDS = SUPPORTED_PLATFORMS.map((p) => p.id);
