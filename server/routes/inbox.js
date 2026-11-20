const express = require("express");
const { pool } = require("../config/db");
const { requireAuth } = require("../middleware/auth");
const { receiveMail, applyMessage, undoMessage, loadMessage, MESSAGE_WITH_APPLICATION } = require("../lib/mailProcessor");

const router = express.Router();
router.use(requireAuth);

const findOwned = async (id, userId) => {
  if (!/^\d+$/.test(String(id))) return null;
  const found = await pool.query("SELECT * FROM inbox_messages WHERE id = $1 AND user_id = $2", [id, userId]);
  return found.rows[0] || null;
};

router.get("/", async (req, res) => {
  const list = await pool.query(
    `${MESSAGE_WITH_APPLICATION}
     WHERE m.user_id = $1
     ORDER BY (m.state = 'pending') DESC, m.created_at DESC, m.id DESC
     LIMIT 100`,
    [req.userId]
  );
  res.json(list.rows);
});

// Paste an email by hand. Forwarded emails take the same path: see /inbound.
router.post("/", async (req, res) => {
  const body = req.body || {};
  const text = String(body.text || "").trim();
  if (text.length < 20) return res.status(400).json({ error: "mail_too_short" });

  const user = (await pool.query("SELECT id, auto_apply FROM users WHERE id = $1", [req.userId])).rows[0];
  if (!user) return res.status(401).json({ error: "invalid_token" });

  const message = await receiveMail(pool, user, {
    sender: body.sender,
    subject: body.subject,
    text,
    source: "paste",
  });
  res.status(201).json(message);
});

router.post("/:id/apply", async (req, res) => {
  const message = await findOwned(req.params.id, req.userId);
  if (!message) return res.status(404).json({ error: "not_found" });
  if (message.state === "applied") return res.json(await loadMessage(pool, message.id));

  const applicationId = req.body?.application_id ?? message.application_id;
  if (!applicationId || !/^\d+$/.test(String(applicationId))) return res.status(400).json({ error: "application_required" });

  const applied = await applyMessage(pool, message, applicationId);
  if (!applied) return res.status(404).json({ error: "not_found" });
  res.json(applied);
});

router.post("/:id/undo", async (req, res) => {
  const message = await findOwned(req.params.id, req.userId);
  if (!message) return res.status(404).json({ error: "not_found" });
  res.json(await undoMessage(pool, message));
});

router.post("/:id/dismiss", async (req, res) => {
  const message = await findOwned(req.params.id, req.userId);
  if (!message) return res.status(404).json({ error: "not_found" });
  if (message.state === "pending") {
    await pool.query("UPDATE inbox_messages SET state = 'dismissed' WHERE id = $1", [message.id]);
  }
  res.json(await loadMessage(pool, message.id));
});

router.delete("/:id", async (req, res) => {
  const message = await findOwned(req.params.id, req.userId);
  if (!message) return res.status(404).json({ error: "not_found" });
  await pool.query("DELETE FROM inbox_messages WHERE id = $1", [message.id]);
  res.status(204).end();
});

module.exports = router;
