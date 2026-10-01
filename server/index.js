const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const rateLimit = require("express-rate-limit");

dotenv.config();
const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*" }));
app.use(express.json());
app.use(rateLimit({ windowMs: 60 * 1000, limit: 60 }));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api", require("./routes/goals"));     
app.use("/api", require("./routes/platforms/platforms"));  

app.use((req, res) => res.status(404).json({ error: "Endpoint not found" }));
app.use((err, req, res, next) => {
  console.error("[Error]", err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

app.listen(process.env.PORT || 5000);