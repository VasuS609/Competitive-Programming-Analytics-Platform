# Competitive Programming Analytics Platform

A React dashboard for Codeforces, LeetCode, and GitHub profiles. It shows solved problems, contest ratings, submission history, and an activity heatmap. The Express API fetches public platform data and caches it in memory. Saved profile handles and display preferences live in the browser.

## Run locally

Use Node.js 20.19+ on the 20.x release line, or Node.js 22.12+.

```sh
npm ci
npm run dev
```

Open [the dashboard](http://localhost:5173) and add your handles. The API runs on port 5000. No database, API keys, or environment files are required for local development.

Copy `server/.env.example` to `server/.env` or `client/.env.example` to `client/.env` to override the defaults. At the repository root, `npm start` runs the API. For a production client build, run `npm run build --prefix client`. Set `CLIENT_ORIGIN` for the API in production and set `VITE_API_URL` before building the client.

## Checks

```sh
npm test
npm run lint --prefix client
npm run build --prefix client
```

## Activity coverage

- Codeforces uses public submission history and counts distinct problems separately from accepted submissions.
- LeetCode supplies daily submission totals and profile-level solved totals. The problem table accumulates publicly available recent solves while the server is running.
- GitHub uses public push events from its API. Coverage depends on the events GitHub returns.
- Charts use UTC dates. Restarting the API clears its in-memory data.
