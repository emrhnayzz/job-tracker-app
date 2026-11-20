const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const env = require("./config/env");
const { AVATAR_DIR } = require("./middleware/fileUpload");
const { router: authRoutes } = require("./routes/auth");
const meRoutes = require("./routes/me");
const applicationRoutes = require("./routes/applications");
const aiRoutes = require("./routes/ai");
const inboxRoutes = require("./routes/inbox");
const { pool } = require("./config/db");
const { receiveMail } = require("./lib/mailProcessor");

const app = express();
app.set("trust proxy", 1);

app.use(cors(env.clientOrigins.length ? { origin: env.clientOrigins } : undefined));

const limit = (max, minutes) =>
  rateLimit({
    windowMs: minutes * 60 * 1000,
    limit: max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => env.isTest,
    message: { error: "too_many_requests" },
  });

// Forwarded emails arrive here from the mail provider's webhook. The token in
// the path is the secret part of the user's personal address. Field names of
// the common providers (Postmark, Mailgun, SendGrid) are all accepted.
// The answer is the same whether the token exists or not.
app.post(
  "/inbound/:token",
  limit(120, 60),
  express.json({ limit: "2mb" }),
  express.urlencoded({ extended: true, limit: "2mb" }),
  async (req, res) => {
    const body = req.body || {};
    const found = await pool.query("SELECT id, auto_apply FROM users WHERE inbox_token = $1", [req.params.token]);
    if (found.rows[0]) {
      await receiveMail(pool, found.rows[0], {
        source: "forward",
        sender: body.From || body.from || body.sender,
        subject: body.Subject || body.subject,
        text: body.TextBody || body.text || body["body-plain"] || body["stripped-text"],
        html: body.HtmlBody || body.html || body["body-html"],
      });
    }
    res.json({ ok: true });
  }
);

app.use(express.json({ limit: "200kb" }));
// A request without a body still gets an empty object, so handlers can read
// fields without checking first.
app.use((req, res, next) => {
  req.body ??= {};
  next();
});

// Avatars are public images. CVs are not served statically: see /applications/:id/cv.
app.use("/uploads/avatars", express.static(AVATAR_DIR, { maxAge: "7d" }));

app.get("/", (req, res) => res.json({ name: "Job Tracker API", status: "ok" }));
app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/auth/demo", limit(15, 60));
app.use("/auth", limit(40, 15), authRoutes);
app.use("/me", meRoutes);
app.use("/applications", applicationRoutes);
app.use("/ai", limit(30, 60), aiRoutes);
app.use("/inbox", inboxRoutes);

app.use((req, res) => res.status(404).json({ error: "not_found" }));

// Express 5 forwards rejected promises from async handlers to this handler.
app.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") return res.status(400).json({ error: "file_too_large" });
  if (err.status === 400) return res.status(400).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: "server_error" });
});

module.exports = app;
