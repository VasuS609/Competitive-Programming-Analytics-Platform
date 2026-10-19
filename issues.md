
Summary
The app only runs on Windows, and the numbers it shows are wrong for most platforms. ESLint and vite build both pass cleanly, so none of this is caught by tooling: these are logic and design bugs, not syntax errors.
I read every source file (about 3,000 lines) and ran the riskiest paths against a fake Codeforces API. Confirmed by running code:
• The server crashes on startup on Linux and macOS, because the database layer hardcodes C:\msys64\ucrt64\bin\sqlite3.exe.
• Codeforces problem IDs collide: 200 solved problems went in, 50 were stored.
• One Codeforces stats request makes 200 synchronous database writes, each one a separate process spawn.
• A 7-day activity query reports 200 accepted problems when only 28 fall inside the window.
• On a server in IST, non-ISO date strings such as 2024-1-5 move to the previous day.
Fix these five first:
1. Replace the sqlite3.exe wrapper with better-sqlite3, which is already in server/package.json but never imported.
2. Build the Codeforces problem ID as contestId-index, then clear the old rows.
3. Stop labelling submission counts as "accepted": only LeetCode actually counts accepted problems.
4. Either wire GitHub and goals end to end or delete them. Both are half-built and unreachable or always failing.
5. Pick one timezone and one fetch-and-cache layer per platform, then delete the dead duplicate files.
Critical: fix first
Six bugs break the app or corrupt its data. Items C1 to C3 are confirmed by running the code.
#
Where
Problem
Fix
C1
server/db/index.js
Hardcoded C:\msys64\ucrt64\bin\sqlite3.exe, and the schema runs at import time. Requiring the module on Linux throws immediately. Every query also spawns a process. better-sqlite3 is listed in package.json but never imported.
Use better-sqlite3: db.exec(schema), native prepare().run() and .all(), and db.transaction for bulk writes. Keep the prepare shape so callers do not change.
C2
cfService.js, fetchFromCF
id: s.problem.contestId gives every problem in a contest the same problem_id, so each upsert overwrites the last. 200 solved became 50 stored. The index field is passed along but never used.
Use `${contestId}-${index}` (the same as problemKey). Run DELETE FROM solved_problems WHERE platform = 'codeforces' once so the old IDs do not linger.
C3
cfService.js into solvedProblemService.js
One synchronous process spawn per problem, blocking the whole server. 200 problems means 200 spawns, repeated on every cache miss (every 10 minutes).
After C1, write all rows in one transaction, and only the new ones.
C4
GitHub, client and server
GitHub is selectable in the UI, but the live services/platformServices.js has no github entry and SUPPORTED_PLATFORMS omits it, so every GitHub request returns 404. githubService.js is only imported by dead code.
Decide: add github to both lists, or remove it from the client lists.
C5
Goals feature
GoalProgress and AddProblemForm are not imported anywhere, and no route or script ever inserts into goals. With zero goals, allGoalMet is true because [].every() is true.
Wire it into App.jsx and add POST /goals, or delete the feature. Return false when there are no goals.
C6
GET /stats and POST /sync
GET stats for Codeforces and LeetCode writes to the database as a side effect. POST /sync only calls the cached stats and re-reads the database, so it cannot force a refresh. For CodeChef, GFG and AtCoder nothing ever stores problems, so sync always reports 0.
Separate read from write. Sync should bypass the cache, fetch fresh data, upsert, then return counts. Hide the button where no problem list exists.
Data correctness: why the numbers are wrong
D1 is almost certainly the "data showing is wrong" problem from nextTask.md. D2, D3 and D4 were confirmed by running code.
#
Where
Problem
Fix
D1
HomeDashboard.jsx, SubmissionCalendar.jsx, all *SubmissionsCalendar.js
Charts are titled "Accepted problems per day" and tooltips say "AC", but only LeetCode counts accepted problems. Codeforces counts every submission of any verdict. CodeChef and GFG heatmaps are submission or contribution counts. GitHub counts public events. AtCoder counts contests that ended that day.
Choose one metric per platform. For Codeforces use first accepted solves (you already compute getFirstSolves). Relabel the others honestly or keep them out of the "accepted" chart. Do not stack unlike metrics in one bar.
D2
cfService.js vs calendars and activity
Codeforces solve activity and weak topics bucket days in IST (DEFAULT_TZ_OFFSET_MIN = 330). The calendars and activity use UTC. One solve can land on different days in different panels.
One date helper and one timezone. If it must be local, send the browser's offset from the client.
D3
utils/dates.js
new Date("2024-1-5") is parsed as local time: in Asia/Kolkata it becomes 2024-01-04. If CodeChef's heatmap uses that format (log one entry to check), every CodeChef day is off by one on an IST server. A single bad value also throws RangeError and fails the whole request.
Parse Y-M-D by hand into UTC, and guard with Number.isNaN. The ternary in toUTCDateString has two identical branches.
D4
activityService.js, createActivity
totals.acceptedProblems collects IDs from all days, not the requested window. The test returned 200 where the window held 28.
Build the ID set from rows, not from daily.
D5
lcSubmissionsCalendar.js
Reads profile.recentSubmissionList, but getLCStats returns recentSubmissions, so the fallback is always empty. It also uses only the last 50 accepted submissions, while LeetCode's real per-day submissionCalendar is already in the stats.
Use submissionCalendar from the stats and drop the second GraphQL call.
D6
lcService.js
Only the 50 most recent accepted problems are stored, with rating always null and no tags. syncedCount suggests a full list.
Keep it, but label it as recent only, or page through all submissions.
D7
Totals on Home
AtCoder totalSolved is hardcoded to 0. GitHub reports public repo count as "problems solved". The "CP" radar value divides by 3 even when one handle is set. "Platforms loaded" always shows /6.
Count only platforms with a handle, leave GitHub out of solved totals, and compute denominators from what is loaded.
D8
cfService.js, solved_problems
user.status includes gym submissions, so problemSolved can differ from the Codeforces profile. first_seen_at is the sync time, not the solve time, so "newest first" means nothing after the first sync.
Decide how to treat gym. Store solved_at from creationTimeSeconds.
D9
utils/dates.js, buildCalendar
Returns [] when there was no activity in 30 days, and trims days before the first activity. Platforms return different day counts, so the stacked chart's x-axis is a patchwork.
Always return N days, with zeros.
Reliability, performance and security
The server downloads the same upstream data several times per page load, caches it inconsistently, and never times out.
#
Where
Problem
Fix
R1
Upstream calls
Codeforces user.status (the full history) is fetched by three code paths: cfService, cfSubmissionsCalendar and activityService, each with its own cache or none. The CodeChef profile HTML (plus a JSDOM parse) is fetched by two. LeetCode makes a second GraphQL call. Codeforces asks API clients to stay near one request per two seconds.
One shared raw-data fetcher per platform with one TTL cache. Calendars and activity derive from it.
R2
server/index.js rate limit
60 requests per minute per IP for the whole API. A first dashboard load is 12 requests, 24 in dev under StrictMode (aborted ones may still reach the server). Each 7 to 30 day toggle adds 6. There is no trust proxy, so behind a proxy all users share one bucket.
Raise or split the limit per route, and set app.set("trust proxy", 1) in production.
R3
Caches in 9 service files
Each file declares its own cache = {} and CACHE_TTL, with no size limit or eviction. Keys are lowercased in some files and case-sensitive in cfService, codechefService and ccSubmissionsCalendar, so Tourist and tourist are fetched twice. Concurrent requests for the same key each fetch again.
One ttlCache helper with normalized keys, a maximum size, and sharing of in-flight promises.
R4
codechefService.js
Magic offsets (indexOf(...) - 34 and - 6). The heatMapStart < 0 and ratingStart < 0 checks can never be true, because indexOf returns -1 and the marker length is then added. ccSubmissionsCalendar.js parses the same data a different way. Positional selectors such as children[2] break on small HTML changes.
One parser: capture the array with a regex, and fail with a clear "CodeChef format changed" 502.
R5
Every upstream fetch
No timeout. GFG depends on a third-party community API (gfg-stats.tashif.codes). A hung upstream hangs the request.
Pass AbortSignal.timeout(8000) and return a clean 504.
R6
db/index.js, quote()
Hand-rolled escaping. It is not obviously injectable because quotes are doubled, but NaN and Infinity produce invalid SQL, booleans become the string 'true', and the statement travels as a command-line argument.
Goes away with C1.
R7
POST /problems
No validation: rating arrives as a string, date is unchecked, duplicates are allowed, and there is no auth. CORS defaults to * when CLIENT_ORIGIN is unset.
Validate types and date format, add a unique index, set CLIENT_ORIGIN, and require auth if you deploy it.
R8
Project setup
app.listen has no callback or error handler. server/package.json has no start script, only dev. No tests in either package. No .env.example for PORT, CLIENT_ORIGIN and VITE_API_URL.
Add them. Start tests with the date helpers and normalizeStats.
R9
atcoderService.js
Reads contests.length before the Array.isArray check.
Check first.
Redundancy and dead code
Much of the "codebase became big" feeling is dead or duplicated code. The first, third and fourth rows are files nothing imports, so they can be deleted outright.
Item
Why it is redundant
Action
server/routes/platforms/platforms.js and getPlatformServices.js
An older copy of platformRouter.js and services/platformServices.js. Never mounted. It also calls normalizeCodeChefRating, which is not defined anywhere.
Delete
services/solvedProblemService.js
One line that re-exports goals/solvedProblemService.js.
Delete, import the real path
services/graphs/comparison.js, totalAccepted.js, weakTopics.js, and client/src/components/Chart/SubmissionsChart.jsx
Empty files (0 bytes).
Delete, or build them
githubService.js
Only imported by the dead files above, unless you wire GitHub (C4).
Delete or wire
/activity endpoint and activityService.js
No client code calls it, and it duplicates what the calendars do.
Merge into the calendar service or delete
solveActivity and weakTopics in the Codeforces stats
Computed and sent on every stats call, but no client file reads them. getCFSolveActivity and getCFWeakTopics are exported and never used. This is the unfinished feature in nextTask.md.
Build the UI or stop computing them
Two "problem" stores
problem (manual log, goals/problemService.js) and solved_problems (synced) are unrelated but similarly named, and live in the same folder.
Rename, for example manualLog and solved
Six calendar files
Each repeats key normalizing, a cache, getLastNDates(30), a counts map and firstActivityDate.
One makeCalendar(fetchDailyCounts) helper
platformRouter.js
Five handlers repeat the same try, catch and next block.
One wrapper function
Platform list
The six platform names are repeated in useStats, ProfileContext, Dashboard, DetailedData, HomeDashboard, plus the server.
One shared platforms.js
Three client fetch layers
api.request, getCachedRequest, and an inline fetch in RatingChart, which also bypasses the cache.
One apiGet with cache and abort
normalizeStats aliases
Emits solved, problemSolved and totalSolved; rating and currentRating; username, handle and name; rank and globalRank. rank is a string for Codeforces and a number for LeetCode. The client has ?? chains in four places and reads a data.accepted field that never exists.
Define one response contract
Dependencies
better-sqlite3 is unused today (it should replace the wrapper). jsdom is loaded only for a few CodeChef selectors.
Use the first, drop the second
Committed files
server/db/tracker.db (110 KB), client/client.pdf, client/src/DSA-Tracker.code-workspace, nextTask.md, skills.md.
Add *.db to .gitignore, git rm --cached them
Unused CSS and tokens
.metric-grid, .chart-grid and .topbar-note are defined but never used. text-ink and bg-paper (8 uses) have no definition, so Tailwind generates no CSS for them.
Define the tokens in @theme, or replace the classes
Small leftovers
package.json metadata points to a repo named Competitive-Programming-Dashboard. A typo, sqlite_scheam, sits in the schema.sql comment.
Fix
Client issues
The client lints and builds cleanly. Its problems are stale data, leaked state, and an unreachable feature.
#
Where
Problem
Fix
K1
useStats and requestCache.js
After "Sync solved problems", the table does not change. The client serves the same cached promise for 5 minutes, on top of the server's 10-minute cache.
Invalidate the cache key and refetch after sync. Add a server-side refresh option.
K2
DetailedData.jsx
DetailedDashboard has no key, so the "Synced N problems" message and the table's page number carry over when you switch platform.
Give it a key built from the platform and the handle, for example key={platform + handle}.
K3
SubmissionCalendar.jsx
Ignores the 7 or 30 day range you chose (the hook default is 7), and the title is hardcoded to "Accepted, past 7 days".
Read days from the profile and fix the title (see D1).
K4
ProfileContext.jsx, validateProfile
Returns the empty default, wiping every saved handle, if any handle is over 40 characters or any platform key is missing. Adding a seventh platform would erase everyone's saved handles.
Merge defaults per key instead of resetting.
K5
ProfileContext.jsx, setHandle
Builds the new handles from the render-time profile, not from the latest state.
Use a functional update.
K6
HomeDashboard.jsx
useMemo depends on activity, a new array every render, so it never helps. JSON.stringify also runs every render. The heat map starts by dispatching a fake DOMContentLoaded on document, which fires every other listener too.
Memoize the inputs, and initialise jheat.js through its own API.
K7
HomeDashboard.jsx
Twelve hook calls and two six-entry arrays are written out by hand, one per platform.
Loop over the platform list, or make one child component per platform.
K8
addProblemForm.jsx
Date and rating are plain text inputs. Success and failure only reach console.log, and the form never resets. It is also not routed anywhere (C5).
Typed inputs, visible feedback, reset on success.
K9
Build output
One 799 kB JavaScript chunk, and Vite warns about it.
Lazy-load the /detailed route and its charts. Low priority.
Suggested fix order
Start by deleting dead code so the codebase shrinks, then fix the database layer, since everything else depends on it. Time estimates are rough guesses for one person.
1. Delete dead files and add *.db to .gitignore (about 30 minutes). See the Redundancy section.
2. Swap the database wrapper for better-sqlite3 (1 to 2 hours). This also makes the app run off Windows (C1, C3, R6).
3. Fix the Codeforces problem ID and clear the old rows (30 minutes) (C2).
4. Settle one timezone and one safe date helper (1 hour) (D2, D3, D9).
5. Fix the metrics and labels: first solves for Codeforces, honest names for the rest, and the activity window and LeetCode field bugs (2 to 3 hours) (D1, D4, D5, D7).
6. Build one shared fetch, cache and timeout layer per platform, plus a ttlCache helper (3 to 4 hours) (R1, R3, R4, R5).
7. Make sync a real refresh and fix the client cache, keys and day range (2 hours) (C6, K1, K2, K3).
8. Decide on GitHub and goals: wire both end to end, or delete them (1 to 2 hours) (C4, C5).
9. Add input validation, a start script, .env.example and first tests for the date helpers and normalizeStats (2 hours) (R7, R8).
Steps 2 to 5 fix almost all of the "data showing is wrong" problem. The rest is robustness.