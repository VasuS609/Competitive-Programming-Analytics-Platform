# DSA Prep Tracker

A full-stack dashboard I built to track my own competitive programming practice — pulls live stats from Codeforces, logs my daily solves against a configurable goal, and visualizes rating progress over time.

Built as a personal tool I use daily, not a tutorial clone — the architecture (caching layer, REST API design, SQLite schema) evolved from real problems I hit while using it (e.g. CF's public API timing out, duplicate fetches across components).

## Why I built this

I'm doing daily DSA practice (Codeforces + LeetCode) with a fixed daily goal (2× 1100-rated + 1× 1000-rated problems). I wanted a single dashboard to see my CF profile stats, track whether I hit my daily goal, and watch my rating trend over time — instead of checking multiple tabs and mentally tallying solves.

## Features

- **Live Codeforces integration** — pulls profile stats (rating, rank, problems solved) via the public CF API
- **Server-side caching** — avoids hammering CF's API on every page load and smooths over their (frequent) flakiness/timeouts
- **Goal tracking** — configurable daily goal system (currently 2× 1100-rated + 1× 1000-rated), logs solves to a local database and shows progress against the goal
- **Problem log** — form to log solved problems (platform, rating, tags) into a persistent store
- **Rating history chart** — a Recharts line chart of CF contest rating over time, served from a dedicated backend endpoint

## Tech stack

- **Frontend:** React, Recharts
- **Backend:** Node.js, Express
- **Database:** SQLite
- **External APIs:** Codeforces public API

## Architecture

```
React (dashboard, forms, charts)
        │
        ▼
Express REST API
  ├── /api/cf/stats/:handle    → cached CF profile summary
  ├── /api/cf/rating/:handle   → cached CF rating history
  ├── /api/problems            → CRUD for locally logged solves
  └── /api/goals                → goal config + progress calculation
        │
        ▼
SQLite (problems, goals)   +   Codeforces public API (external, cached)
```

Caching sits between the Express routes and the Codeforces API so that repeated page loads (or multiple components needing CF data) don't each trigger a fresh external call — this became necessary after hitting CF rate limits and 504s during development.

## Setup

```bash
# backend
cd server
npm install
npm run dev

# frontend
cd client
npm install
npm start
```

Set your Codeforces handle in `.env` (or the config file — adjust to match your actual setup) before running.

## Current status

This is a working, actively-used tool — not a finished product. What's live right now:

-  CF profile stats with caching
-  CF rating-history chart
-  Local problem log (SQLite) with a configurable goal system
-  Goal progress view

## Roadmap

- [ ] Problems-solved-by-difficulty chart (from own solve log)
- [ ] Topic/tag breakdown (which DSA topics need more practice)
- [ ] LeetCode integration (no official public API — needs a workaround)
- [ ] Unified CF + LeetCode view
- [ ] Auto-refresh / cron-style periodic data pull instead of fetch-on-mount
- [ ] Combine the stats + rating-history endpoints into one cached response to halve external calls per page load

## What I learned building this

- Designing a small REST API from scratch (route structure, cache-aside pattern) rather than following a tutorial
- Handling flaky third-party APIs gracefully (timeouts, 504s) instead of letting them crash the UI
- SQLite schema design for a simple but real persistent store
- React data-fetching patterns (hooks, loading/error states) and Recharts for time-series visualization

---

*This project is under active daily development as I continue my DSA prep — new features get added as I need them.*
