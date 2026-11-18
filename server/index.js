const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const rateLimit = require("express-rate-limit");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const IS_PROD = process.env.NODE_ENV === "production";

// --- CORS ---
// In production CLIENT_ORIGIN must be set; in development it defaults to localhost.
const rawOrigin = process.env.CLIENT_ORIGIN;
let allowedOrigins;

if (rawOrigin) {
  // Support a comma-separated list of origins.
  allowedOrigins = rawOrigin.split(",").map((o) => o.trim()).filter(Boolean);
} else if (IS_PROD) {
  console.error(
    "[startup] CLIENT_ORIGIN is not set. Set it to the allowed client URL(s) before running in production.",
  );
  process.exit(1);
} else {
  allowedOrigins = ["http://localhost:5173"];
}

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no Origin header (server-to-server, curl, etc.).
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: Origin '${origin}' is not allowed`));
    },
  }),
);

app.use(express.json());

// Global rate limit — all routes.
app.use(rateLimit({ windowMs: 60 * 1000, limit: 60 }));

// --- Routes ---
app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api", require("./routes/platformRouter"));
app.use("/api/graphs", require("./routes/graphs"));
app.use("/api/heatmap", require("./routes/heatmap"));

// --- 404 ---
app.use((req, res) => res.status(404).json({ error: "Endpoint not found" }));

// --- Global error handler ---
// Full error is logged server-side; only safe messages are forwarded to clients.
// Known safe error types carry isUserFacing = true (set by our own code).
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error("[Error]", err);
  const status = err.status || 500;
  const message =
    err.isUserFacing || status === 400 || status === 404 || status === 429
      ? err.message
      : "Internal server error";
  res.status(status).json({ error: message });
});

// --- Server startup ---
let server;
if (process.env.NODE_ENV !== "test") {
  server = app.listen(PORT, () => {
    console.log(`[server] Listening on port ${PORT}`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `[startup] Port ${PORT} is already in use. Set a different PORT in .env or stop the conflicting process.`,
      );
    } else {
      console.error("[startup] Server error:", err.message);
    }
    process.exit(1);
  });
}

module.exports = app; // exported for tests
module.exports.server = server;
