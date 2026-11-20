const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const env = require("./config/env");
const { AVATAR_DIR } = require("./middleware/fileUpload");
const { router: authRoutes } = require("./routes/auth");
const meRoutes = require("./routes/me");
const applicationRoutes = require("./routes/applications");
const aiRoutes = require("./routes/ai");

const app = express();
app.set("trust proxy", 1);

app.use(cors(env.clientOrigins.length ? { origin: env.clientOrigins } : undefined));
app.use(express.json({ limit: "200kb" }));

// Avatars are public images. CVs are not served statically: see /applications/:id/cv.
app.use("/uploads/avatars", express.static(AVATAR_DIR, { maxAge: "7d" }));

const limit = (max, minutes) =>
  rateLimit({
    windowMs: minutes * 60 * 1000,
    limit: max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => env.isTest,
    message: { error: "too_many_requests" },
  });

app.get("/", (req, res) => res.json({ name: "Job Tracker API", status: "ok" }));
app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/auth/demo", limit(15, 60));
app.use("/auth", limit(40, 15), authRoutes);
app.use("/me", meRoutes);
app.use("/applications", applicationRoutes);
app.use("/ai", limit(30, 60), aiRoutes);

app.use((req, res) => res.status(404).json({ error: "not_found" }));

// Express 5 forwards rejected promises from async handlers to this handler.
app.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") return res.status(400).json({ error: "file_too_large" });
  if (err.status === 400) return res.status(400).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: "server_error" });
});

module.exports = app;
