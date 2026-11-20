const express = require("express");
const path = require("path");
const fs = require("fs");
const { pool } = require("../config/db");
const { requireAuth } = require("../middleware/auth");
const { uploadCv, removeFile, CV_DIR } = require("../middleware/fileUpload");
const { STATUSES, parseApplication, text, date } = require("../lib/applicationInput");
const { appliedDateFor, followUpFor } = require("../lib/rules");

const router = express.Router();
router.use(requireAuth);

const COLUMNS = [
  "company", "position", "status", "applied_date", "work_type", "location",
  "salary_min", "salary_max", "currency", "link", "description",
  "recruiter_name", "recruiter_email", "notes", "interview_date", "follow_up_date", "interest",
];

// Loads an application only if it belongs to the signed-in user. Someone
// else's id looks exactly like an id that does not exist.
const findOwned = async (id, userId) => {
  if (!/^\d+$/.test(String(id))) return null;
  const found = await pool.query("SELECT * FROM applications WHERE id = $1 AND user_id = $2", [id, userId]);
  return found.rows[0] || null;
};

const addEvent = (applicationId, event) =>
  pool.query(
    "INSERT INTO application_events (application_id, type, from_status, to_status, note) VALUES ($1,$2,$3,$4,$5)",
    [applicationId, event.type, event.from ?? null, event.to ?? null, event.note ?? null]
  );


router.get("/", async (req, res) => {
  const list = await pool.query(
    `SELECT a.*,
            (SELECT MAX(e.created_at) FROM application_events e WHERE e.application_id = a.id) AS last_activity_at,
            EXISTS (SELECT 1 FROM application_events e
                    WHERE e.application_id = a.id AND e.to_status = 'Interview') AS had_interview,
            (SELECT COUNT(*)::int FROM application_tasks t WHERE t.application_id = a.id AND NOT t.done) AS open_tasks,
            (SELECT MIN(t.due_date) FROM application_tasks t WHERE t.application_id = a.id AND NOT t.done) AS next_task_due
     FROM applications a
     WHERE a.user_id = $1
     ORDER BY a.created_at DESC`,
    [req.userId]
  );
  res.json(list.rows);
});

router.get("/:id", async (req, res) => {
  const application = await findOwned(req.params.id, req.userId);
  if (!application) return res.status(404).json({ error: "not_found" });

  const events = await pool.query(
    "SELECT * FROM application_events WHERE application_id = $1 ORDER BY created_at DESC, id DESC",
    [application.id]
  );
  const tasks = await pool.query(
    "SELECT * FROM application_tasks WHERE application_id = $1 ORDER BY done, due_date NULLS LAST, id",
    [application.id]
  );
  res.json({ ...application, events: events.rows, tasks: tasks.rows });
});

router.post("/", uploadCv, async (req, res) => {
  const { values, error } = parseApplication(req.body);
  if (error) {
    if (req.file) removeFile(req.file.path);
    return res.status(400).json({ error });
  }
  values.applied_date = appliedDateFor(values.status, values.applied_date);
  values.follow_up_date = followUpFor(values.status, null, values.follow_up_date);

  const created = await pool.query(
    `INSERT INTO applications (user_id, ${COLUMNS.join(", ")}, cv_path, cv_name)
     VALUES ($1, ${COLUMNS.map((_, i) => `$${i + 2}`).join(", ")}, $${COLUMNS.length + 2}, $${COLUMNS.length + 3})
     RETURNING *`,
    [
      req.userId,
      ...COLUMNS.map((column) => values[column]),
      req.file ? req.file.filename : null,
      req.file ? req.file.originalname.slice(0, 200) : null,
    ]
  );

  const application = created.rows[0];
  await addEvent(application.id, { type: "created", to: application.status });
  res.status(201).json(application);
});

router.put("/:id", uploadCv, async (req, res) => {
  const existing = await findOwned(req.params.id, req.userId);
  const { values, error } = parseApplication(req.body);
  if (!existing || error) {
    if (req.file) removeFile(req.file.path);
    return existing ? res.status(400).json({ error }) : res.status(404).json({ error: "not_found" });
  }
  values.applied_date = appliedDateFor(values.status, values.applied_date);
  values.follow_up_date = followUpFor(values.status, existing.status, values.follow_up_date);

  const updated = await pool.query(
    `UPDATE applications
     SET ${COLUMNS.map((column, i) => `${column} = $${i + 1}`).join(", ")},
         cv_path = $${COLUMNS.length + 1}, cv_name = $${COLUMNS.length + 2}, updated_at = NOW()
     WHERE id = $${COLUMNS.length + 3}
     RETURNING *`,
    [
      ...COLUMNS.map((column) => values[column]),
      req.file ? req.file.filename : existing.cv_path,
      req.file ? req.file.originalname.slice(0, 200) : existing.cv_name,
      existing.id,
    ]
  );

  if (req.file && existing.cv_path) removeFile(path.join(CV_DIR, path.basename(existing.cv_path)));
  if (existing.status !== values.status) {
    await addEvent(existing.id, { type: "status", from: existing.status, to: values.status });
  }
  res.json(updated.rows[0]);
});

// Used by drag and drop on the board: changes only the status.
router.patch("/:id/status", async (req, res) => {
  const existing = await findOwned(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: "not_found" });

  const status = req.body.status;
  if (!STATUSES.includes(status)) return res.status(400).json({ error: "invalid_status" });
  if (status === existing.status) return res.json(existing);

  const updated = await pool.query(
    `UPDATE applications SET status = $1, applied_date = $2, follow_up_date = $3, updated_at = NOW()
     WHERE id = $4 RETURNING *`,
    [
      status,
      appliedDateFor(status, existing.applied_date),
      followUpFor(status, existing.status, existing.follow_up_date),
      existing.id,
    ]
  );
  await addEvent(existing.id, { type: "status", from: existing.status, to: status });
  res.json(updated.rows[0]);
});

router.post("/:id/events", async (req, res) => {
  const existing = await findOwned(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: "not_found" });

  const note = text(req.body.note, 2000);
  if (!note) return res.status(400).json({ error: "note_required" });

  const created = await pool.query(
    "INSERT INTO application_events (application_id, type, note) VALUES ($1, 'note', $2) RETURNING *",
    [existing.id, note]
  );
  res.status(201).json(created.rows[0]);
});

// Tasks: the to-do list of one application. `titles` adds several at once,
// which the client uses for the suggested steps of a stage.
router.post("/:id/tasks", async (req, res) => {
  const existing = await findOwned(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: "not_found" });

  const titles = (Array.isArray(req.body.titles) ? req.body.titles : [req.body.title])
    .map((title) => text(title, 200))
    .filter(Boolean)
    .slice(0, 10);
  if (titles.length === 0) return res.status(400).json({ error: "title_required" });

  // A task that is already on the list is not added a second time.
  const present = await pool.query("SELECT LOWER(title) AS title FROM application_tasks WHERE application_id = $1", [
    existing.id,
  ]);
  const known = new Set(present.rows.map((row) => row.title));

  const created = [];
  for (const title of titles) {
    if (known.has(title.toLowerCase())) continue;
    known.add(title.toLowerCase());
    const row = await pool.query(
      "INSERT INTO application_tasks (application_id, title, due_date) VALUES ($1, $2, $3) RETURNING *",
      [existing.id, title, date(req.body.due_date)]
    );
    created.push(row.rows[0]);
  }
  res.status(201).json(created);
});

router.patch("/:id/tasks/:taskId", async (req, res) => {
  const existing = await findOwned(req.params.id, req.userId);
  if (!existing || !/^\d+$/.test(req.params.taskId)) return res.status(404).json({ error: "not_found" });

  const updated = await pool.query(
    `UPDATE application_tasks
     SET done = COALESCE($1, done), title = COALESCE($2, title),
         due_date = CASE WHEN $3 THEN $4::date ELSE due_date END
     WHERE id = $5 AND application_id = $6
     RETURNING *`,
    [
      typeof req.body.done === "boolean" ? req.body.done : null,
      text(req.body.title, 200),
      req.body.due_date !== undefined,
      date(req.body.due_date),
      req.params.taskId,
      existing.id,
    ]
  );
  if (updated.rowCount === 0) return res.status(404).json({ error: "not_found" });
  res.json(updated.rows[0]);
});

router.delete("/:id/tasks/:taskId", async (req, res) => {
  const existing = await findOwned(req.params.id, req.userId);
  if (!existing || !/^\d+$/.test(req.params.taskId)) return res.status(404).json({ error: "not_found" });

  await pool.query("DELETE FROM application_tasks WHERE id = $1 AND application_id = $2", [
    req.params.taskId,
    existing.id,
  ]);
  res.status(204).end();
});

// CVs are personal documents, so they are only served to their owner.
router.get("/:id/cv", async (req, res) => {
  const existing = await findOwned(req.params.id, req.userId);
  if (!existing || !existing.cv_path) return res.status(404).json({ error: "not_found" });

  const file = path.join(CV_DIR, path.basename(existing.cv_path));
  if (!fs.existsSync(file)) return res.status(404).json({ error: "file_missing" });
  res.download(file, existing.cv_name || "cv.pdf");
});

router.delete("/:id", async (req, res) => {
  const existing = await findOwned(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: "not_found" });

  await pool.query("DELETE FROM applications WHERE id = $1", [existing.id]);
  if (existing.cv_path) removeFile(path.join(CV_DIR, path.basename(existing.cv_path)));
  res.status(204).end();
});

module.exports = router;
