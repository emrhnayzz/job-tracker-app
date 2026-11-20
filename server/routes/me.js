const express = require("express");
const bcrypt = require("bcrypt");
const path = require("path");
const { pool } = require("../config/db");
const { requireAuth } = require("../middleware/auth");
const { uploadAvatar, removeFile, CV_DIR, AVATAR_DIR } = require("../middleware/fileUpload");
const { publicUser, EMAIL_PATTERN, newInboxToken } = require("./auth");

const router = express.Router();
router.use(requireAuth);

const loadUser = async (id) => (await pool.query("SELECT * FROM users WHERE id = $1", [id])).rows[0];

router.get("/", async (req, res) => {
  let user = await loadUser(req.userId);
  if (!user) return res.status(401).json({ error: "invalid_token" });
  // Accounts from before the inbox feature get their token on first use.
  if (!user.inbox_token) {
    await pool.query("UPDATE users SET inbox_token = $1 WHERE id = $2 AND inbox_token IS NULL", [newInboxToken(), user.id]);
    user = await loadUser(req.userId);
  }
  res.json(publicUser(user));
});

router.put("/", uploadAvatar, async (req, res) => {
  const user = await loadUser(req.userId);
  if (!user) return res.status(401).json({ error: "invalid_token" });

  const username = req.body.username === undefined ? user.username : String(req.body.username).trim();
  const email = req.body.email === undefined ? user.email : String(req.body.email).trim().toLowerCase();
  const bio = req.body.bio === undefined ? user.bio : String(req.body.bio).trim().slice(0, 2000) || null;
  const skills = req.body.skills === undefined ? user.skills : String(req.body.skills).trim().slice(0, 1000) || null;
  const goal = req.body.weekly_goal === undefined ? user.weekly_goal : Number.parseInt(req.body.weekly_goal, 10);
  if (!Number.isInteger(goal) || goal < 1 || goal > 50) return res.status(400).json({ error: "invalid_goal" });
  const flag = (value, current) => (value === undefined ? current : value === true || value === "true");
  const autoApply = flag(req.body.auto_apply, user.auto_apply);
  const autoTasks = flag(req.body.auto_tasks, user.auto_tasks);

  if (username.length < 2 || username.length > 50) return res.status(400).json({ error: "invalid_username" });
  if (!user.is_demo && !EMAIL_PATTERN.test(email)) return res.status(400).json({ error: "invalid_email" });

  let passwordHash = user.password_hash;
  if (req.body.newPassword) {
    if (user.is_demo) return res.status(400).json({ error: "not_available_in_demo" });
    if (String(req.body.newPassword).length < 8) return res.status(400).json({ error: "password_too_short" });
    const currentOk = await bcrypt.compare(String(req.body.currentPassword || ""), user.password_hash);
    if (!currentOk) return res.status(400).json({ error: "wrong_current_password" });
    passwordHash = await bcrypt.hash(String(req.body.newPassword), 10);
  }

  const taken = await pool.query(
    "SELECT 1 FROM users WHERE (email = $1 OR username = $2) AND id <> $3",
    [email, username, user.id]
  );
  if (taken.rowCount > 0) return res.status(409).json({ error: "user_exists" });

  const avatarPath = req.file ? `uploads/avatars/${req.file.filename}` : user.avatar_path;
  const updated = await pool.query(
    `UPDATE users SET username = $1, email = $2, bio = $3, password_hash = $4, avatar_path = $5,
                      skills = $6, weekly_goal = $7, auto_apply = $8, auto_tasks = $9
     WHERE id = $10 RETURNING *`,
    [username, user.is_demo ? user.email : email, bio, passwordHash, avatarPath, skills, goal, autoApply, autoTasks, user.id]
  );

  if (req.file && user.avatar_path) removeFile(path.join(AVATAR_DIR, path.basename(user.avatar_path)));
  res.json(publicUser(updated.rows[0]));
});

// Deleting the account removes every trace: applications, events and files.
router.delete("/", async (req, res) => {
  const user = await loadUser(req.userId);
  if (!user) return res.status(204).end();

  const files = await pool.query("SELECT cv_path FROM applications WHERE user_id = $1 AND cv_path IS NOT NULL", [
    user.id,
  ]);
  await pool.query("DELETE FROM applications WHERE user_id = $1", [user.id]);
  await pool.query("DELETE FROM users WHERE id = $1", [user.id]);

  for (const row of files.rows) removeFile(path.join(CV_DIR, path.basename(row.cv_path)));
  if (user.avatar_path) removeFile(path.join(AVATAR_DIR, path.basename(user.avatar_path)));
  res.status(204).end();
});

module.exports = router;
