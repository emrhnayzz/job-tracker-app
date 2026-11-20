const env = require("../config/env");
const { classifyMail, matchApplication, proposedStatus } = require("./mailClassifier");
const { appliedDateFor, followUpFor } = require("./rules");

// Above this confidence an email may change a status without being asked,
// if the user switched that on. Below it the app only proposes.
const HIGH_CONFIDENCE = 0.75;

const clip = (value, max) => String(value ?? "").trim().slice(0, max);

const stripHtml = (html) =>
  String(html || "")
    .replace(/<(style|script)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>|<\/(p|div|li|tr|h\d)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/[ \t]+/g, " ")
    .trim();

const MESSAGE_WITH_APPLICATION = `
  SELECT m.*, a.company, a.position, a.status AS application_status
  FROM inbox_messages m
  LEFT JOIN applications a ON a.id = m.application_id`;

const loadMessage = async (db, id) =>
  (await db.query(`${MESSAGE_WITH_APPLICATION} WHERE m.id = $1`, [id])).rows[0];

// Applies what an email says to its application and remembers the previous
// state, so the step can be undone.
const applyMessage = async (db, message, applicationId = message.application_id) => {
  const found = await db.query("SELECT * FROM applications WHERE id = $1 AND user_id = $2", [
    applicationId,
    message.user_id,
  ]);
  const application = found.rows[0];
  if (!application) return null;

  const status = proposedStatus(message.kind, application.status) || application.status;
  const interviewDate =
    message.kind === "interview" && message.interview_date ? message.interview_date : application.interview_date;

  await db.query(
    `UPDATE applications
     SET status = $1, applied_date = $2, follow_up_date = $3, interview_date = $4, updated_at = NOW()
     WHERE id = $5`,
    [
      status,
      appliedDateFor(status, application.applied_date),
      followUpFor(status, application.status, application.follow_up_date),
      interviewDate,
      application.id,
    ]
  );

  const changed = status !== application.status;
  const event = await db.query(
    `INSERT INTO application_events (application_id, type, from_status, to_status, note, auto, mail_kind)
     VALUES ($1, $2, $3, $4, $5, TRUE, $6) RETURNING id`,
    [application.id, changed ? "status" : "mail", changed ? application.status : null, changed ? status : null, message.subject, message.kind]
  );

  await db.query(
    `UPDATE inbox_messages
     SET state = 'applied', application_id = $1, proposed_status = $2, previous_status = $3,
         previous_interview_date = $4, event_id = $5
     WHERE id = $6`,
    [application.id, changed ? status : null, application.status, application.interview_date, event.rows[0].id, message.id]
  );
  return loadMessage(db, message.id);
};

const undoMessage = async (db, message) => {
  if (message.state !== "applied" || !message.application_id) return loadMessage(db, message.id);
  await db.query(
    "UPDATE applications SET status = $1, interview_date = $2, updated_at = NOW() WHERE id = $3 AND user_id = $4",
    [message.previous_status, message.previous_interview_date, message.application_id, message.user_id]
  );
  if (message.event_id) await db.query("DELETE FROM application_events WHERE id = $1", [message.event_id]);
  await db.query("UPDATE inbox_messages SET state = 'pending', event_id = NULL WHERE id = $1", [message.id]);
  return loadMessage(db, message.id);
};

// Takes one email (pasted, forwarded or from the demo), works out what it
// means and which application it belongs to, and stores it as a proposal.
const receiveMail = async (db, user, mail) => {
  const sender = clip(mail.sender, 255);
  const subject = clip(mail.subject, 500);
  const text = clip(mail.text || stripHtml(mail.html), 20000);

  const result = classifyMail({ subject, text }, { timeZone: env.timeZone });
  const applications = (
    await db.query("SELECT id, company, position, status FROM applications WHERE user_id = $1", [user.id])
  ).rows;
  const application = result.kind === "unknown" ? null : matchApplication({ sender, subject, text }, applications);

  const inserted = await db.query(
    `INSERT INTO inbox_messages
       (user_id, application_id, source, sender, subject, body, kind, confidence, proposed_status, interview_date)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [
      user.id,
      application?.id ?? null,
      mail.source || "paste",
      sender || null,
      subject || null,
      text,
      result.kind,
      result.confidence,
      proposedStatus(result.kind, application?.status ?? null),
      result.interviewDate,
    ]
  );
  const message = inserted.rows[0];

  if (user.auto_apply && application && result.confidence >= HIGH_CONFIDENCE) {
    return applyMessage(db, message);
  }
  return loadMessage(db, message.id);
};

module.exports = { receiveMail, applyMessage, undoMessage, loadMessage, MESSAGE_WITH_APPLICATION, HIGH_CONFIDENCE };
