const express = require("express");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { pool } = require("../config/db");
const { signToken } = require("../middleware/auth");
const { seedDemoApplications, DEMO_SKILLS } = require("../lib/demoData");

const router = express.Router();

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const publicUser = (row) => ({
  id: row.id,
  username: row.username,
  email: row.email,
  avatar_path: row.avatar_path,
  bio: row.bio,
  skills: row.skills,
  weekly_goal: row.weekly_goal,
  is_demo: row.is_demo,
  created_at: row.created_at,
});

router.post("/register", async (req, res) => {
  const username = String(req.body.username || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (username.length < 2 || username.length > 50) return res.status(400).json({ error: "invalid_username" });
  if (!EMAIL_PATTERN.test(email) || email.length > 100) return res.status(400).json({ error: "invalid_email" });
  if (password.length < 8) return res.status(400).json({ error: "password_too_short" });

  const taken = await pool.query("SELECT 1 FROM users WHERE email = $1 OR username = $2", [email, username]);
  if (taken.rowCount > 0) return res.status(409).json({ error: "user_exists" });

  const hash = await bcrypt.hash(password, 10);
  const created = await pool.query(
    "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *",
    [username, email, hash]
  );

  const user = created.rows[0];
  res.status(201).json({ token: signToken(user.id), user: publicUser(user) });
});

router.post("/login", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  const found = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  const user = found.rows[0];
  // Same answer for "no such user" and "wrong password".
  if (!user || user.is_demo || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: "invalid_credentials" });
  }

  res.json({ token: signToken(user.id), user: publicUser(user) });
});

// One-click demo: every visitor gets a private sandbox account with sample
// data. Sandboxes older than a day are removed whenever a new one is created.
router.post("/demo", async (req, res) => {
  const lang = req.body.lang === "en" ? "en" : "de";
  const suffix = crypto.randomBytes(5).toString("hex");
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query(
      `DELETE FROM applications WHERE user_id IN
         (SELECT id FROM users WHERE is_demo AND created_at < NOW() - INTERVAL '1 day')`
    );
    await client.query("DELETE FROM users WHERE is_demo AND created_at < NOW() - INTERVAL '1 day'");

    const created = await client.query(
      `INSERT INTO users (username, email, password_hash, is_demo, bio, skills)
       VALUES ($1, $2, '!', TRUE, $3, $4) RETURNING *`,
      [
        `demo-${suffix}`,
        `demo-${suffix}@demo.invalid`,
        lang === "de"
          ? "Wirtschaftsinformatik-Student mit vier eigenen Apps im App Store. Erfahrung mit React Native, Swift und Supabase."
          : "Business informatics student with four apps of my own on the App Store. Experience with React Native, Swift and Supabase.",
        DEMO_SKILLS,
      ]
    );
    const user = created.rows[0];
    await seedDemoApplications(client, user.id, lang);
    await client.query("COMMIT");

    res.status(201).json({ token: signToken(user.id), user: publicUser(user) });
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
});

module.exports = { router, publicUser, EMAIL_PATTERN };
