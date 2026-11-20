// Integration tests against a real PostgreSQL database.
// Run with: TEST_DATABASE_URL=postgres://... npm test
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

if (!process.env.TEST_DATABASE_URL) {
  test("API tests need TEST_DATABASE_URL", { skip: true }, () => {});
} else {
  const app = require("../app");
  const { pool, initDB } = require("../config/db");

  const register = async (name) => {
    const res = await request(app)
      .post("/auth/register")
      .send({ username: name, email: `${name}@example.com`, password: "correct-horse-battery" });
    assert.equal(res.status, 201);
    return { token: res.body.token, user: res.body.user };
  };
  const as = (session) => ({ Authorization: `Bearer ${session.token}` });

  let alice;
  let bob;

  before(async () => {
    await initDB();
    await pool.query("TRUNCATE application_events, applications, users RESTART IDENTITY CASCADE");
    alice = await register("alice");
    bob = await register("bob");
  });

  after(() => pool.end());

  test("registration validates input and rejects duplicates", async () => {
    const weak = await request(app)
      .post("/auth/register")
      .send({ username: "carol", email: "carol@example.com", password: "short" });
    assert.equal(weak.status, 400);
    assert.equal(weak.body.error, "password_too_short");

    const duplicate = await request(app)
      .post("/auth/register")
      .send({ username: "alice2", email: "alice@example.com", password: "correct-horse-battery" });
    assert.equal(duplicate.status, 409);
  });

  test("login returns a token only for the right password", async () => {
    const wrong = await request(app).post("/auth/login").send({ email: "alice@example.com", password: "nope-nope-nope" });
    assert.equal(wrong.status, 401);

    const right = await request(app)
      .post("/auth/login")
      .send({ email: "alice@example.com", password: "correct-horse-battery" });
    assert.equal(right.status, 200);
    assert.ok(right.body.token);
    assert.equal(right.body.user.password_hash, undefined);
  });

  test("protected routes reject missing and forged tokens", async () => {
    assert.equal((await request(app).get("/applications")).status, 401);
    assert.equal((await request(app).get("/applications").set("Authorization", "Bearer forged")).status, 401);
    assert.equal((await request(app).get("/me")).status, 401);
  });

  test("a user can create, read, update and delete an application", async () => {
    const created = await request(app)
      .post("/applications")
      .set(as(alice))
      .send({ company: "Acme", position: "Developer", status: "Applied", salary_min: "15" });
    assert.equal(created.status, 201);
    assert.equal(created.body.user_id, alice.user.id);
    assert.equal(created.body.salary_min, 15);
    assert.ok(created.body.applied_date, "applied date is stamped automatically");

    const id = created.body.id;
    const updated = await request(app)
      .put(`/applications/${id}`)
      .set(as(alice))
      .send({ company: "Acme GmbH", position: "Developer", status: "Applied" });
    assert.equal(updated.body.company, "Acme GmbH");

    const list = await request(app).get("/applications").set(as(alice));
    assert.equal(list.body.length, 1);

    assert.equal((await request(app).delete(`/applications/${id}`).set(as(alice))).status, 204);
    assert.equal((await request(app).get(`/applications/${id}`).set(as(alice))).status, 404);
  });

  test("invalid applications are rejected", async () => {
    const noCompany = await request(app).post("/applications").set(as(alice)).send({ position: "Developer" });
    assert.equal(noCompany.status, 400);

    const badStatus = await request(app)
      .post("/applications")
      .set(as(alice))
      .send({ company: "Acme", position: "Developer", status: "Hired" });
    assert.equal(badStatus.body.error, "invalid_status");
  });

  test("users cannot see or change each other's applications", async () => {
    const created = await request(app)
      .post("/applications")
      .set(as(alice))
      .send({ company: "Private Corp", position: "Analyst" });
    const id = created.body.id;

    assert.equal((await request(app).get(`/applications/${id}`).set(as(bob))).status, 404);
    assert.equal(
      (await request(app).put(`/applications/${id}`).set(as(bob)).send({ company: "Hacked", position: "x" })).status,
      404
    );
    assert.equal(
      (await request(app).patch(`/applications/${id}/status`).set(as(bob)).send({ status: "Offer" })).status,
      404
    );
    assert.equal((await request(app).delete(`/applications/${id}`).set(as(bob))).status, 404);
    assert.equal((await request(app).get("/applications").set(as(bob))).body.length, 0);

    // The user id in the body is ignored: ownership always comes from the token.
    const spoofed = await request(app)
      .post("/applications")
      .set(as(bob))
      .send({ company: "Spoof", position: "x", user_id: alice.user.id });
    assert.equal(spoofed.body.user_id, bob.user.id);

    const untouched = await request(app).get(`/applications/${id}`).set(as(alice));
    assert.equal(untouched.body.company, "Private Corp");
  });

  test("status changes and notes build the timeline", async () => {
    const created = await request(app)
      .post("/applications")
      .set(as(alice))
      .send({ company: "Timeline Inc", position: "Engineer", status: "Saved" });
    const id = created.body.id;
    assert.equal(created.body.applied_date, null, "a saved job has not been applied to yet");

    const moved = await request(app).patch(`/applications/${id}/status`).set(as(alice)).send({ status: "Applied" });
    assert.ok(moved.body.applied_date, "moving out of Saved stamps the applied date");

    await request(app).patch(`/applications/${id}/status`).set(as(alice)).send({ status: "Interview" });
    await request(app).post(`/applications/${id}/events`).set(as(alice)).send({ note: "Called the recruiter" });

    const detail = await request(app).get(`/applications/${id}`).set(as(alice));
    const types = detail.body.events.map((event) => event.type).sort();
    assert.deepEqual(types, ["created", "note", "status", "status"]);
    const lastMove = detail.body.events.find((event) => event.to_status === "Interview");
    assert.equal(lastMove.from_status, "Applied");
  });

  test("the demo creates a private sandbox with sample data", async () => {
    const first = await request(app).post("/auth/demo").send({ lang: "de" });
    const second = await request(app).post("/auth/demo").send({ lang: "en" });
    assert.equal(first.status, 201);
    assert.equal(first.body.user.is_demo, true);
    assert.notEqual(first.body.user.id, second.body.user.id);

    const list = await request(app).get("/applications").set("Authorization", `Bearer ${first.body.token}`);
    assert.ok(list.body.length >= 10);
    assert.ok(list.body.some((item) => item.status === "Offer"));

    // Demo accounts cannot be used to log in with a password.
    const login = await request(app).post("/auth/login").send({ email: first.body.user.email, password: "!" });
    assert.equal(login.status, 401);
  });

  test("the profile can be updated and the password needs the current one", async () => {
    const bio = await request(app).put("/me").set(as(bob)).send({ bio: "Student in Jena" });
    assert.equal(bio.body.bio, "Student in Jena");

    const wrong = await request(app)
      .put("/me")
      .set(as(bob))
      .send({ currentPassword: "wrong", newPassword: "another-long-password" });
    assert.equal(wrong.body.error, "wrong_current_password");

    const right = await request(app)
      .put("/me")
      .set(as(bob))
      .send({ currentPassword: "correct-horse-battery", newPassword: "another-long-password" });
    assert.equal(right.status, 200);
  });

  test("without an API key the cover letter falls back to a labelled template", async () => {
    const res = await request(app)
      .post("/ai/cover-letter")
      .set(as(alice))
      .send({ company: "Acme", position: "Developer", lang: "de" });
    assert.equal(res.status, 200);
    assert.equal(res.body.source, "template");
    assert.match(res.body.letter, /Acme/);
  });

  test("tasks belong to one application and can be ticked off", async () => {
    const created = await request(app).post("/applications").set(as(alice)).send({ company: "Tasks AG", position: "Dev" });
    const id = created.body.id;

    const added = await request(app)
      .post(`/applications/${id}/tasks`)
      .set(as(alice))
      .send({ titles: ["Research the company", "Prepare questions"], due_date: "2030-01-15" });
    assert.equal(added.status, 201);
    assert.equal(added.body.length, 2);

    const taskId = added.body[0].id;
    const ticked = await request(app).patch(`/applications/${id}/tasks/${taskId}`).set(as(alice)).send({ done: true });
    assert.equal(ticked.body.done, true);
    assert.equal(ticked.body.title, "Research the company");

    // Another user cannot touch the task, even with the right ids.
    assert.equal(
      (await request(app).patch(`/applications/${id}/tasks/${taskId}`).set(as(bob)).send({ done: false })).status,
      404
    );
    assert.equal((await request(app).post(`/applications/${id}/tasks`).set(as(bob)).send({ title: "x" })).status, 404);

    const list = await request(app).get("/applications").set(as(alice));
    const row = list.body.find((item) => item.id === id);
    assert.equal(row.open_tasks, 1);
    assert.ok(row.next_task_due);

    assert.equal((await request(app).delete(`/applications/${id}/tasks/${taskId}`).set(as(alice))).status, 204);
    const detail = await request(app).get(`/applications/${id}`).set(as(alice));
    assert.equal(detail.body.tasks.length, 1);
  });

  test("interest, weekly goal and the interview flag are stored", async () => {
    const created = await request(app)
      .post("/applications")
      .set(as(alice))
      .send({ company: "Rated GmbH", position: "Dev", interest: 3 });
    assert.equal(created.body.interest, 3);
    const invalid = await request(app).post("/applications").set(as(alice)).send({ company: "R", position: "D", interest: 9 });
    assert.equal(invalid.body.interest, null);

    await request(app).patch(`/applications/${created.body.id}/status`).set(as(alice)).send({ status: "Interview" });
    await request(app).patch(`/applications/${created.body.id}/status`).set(as(alice)).send({ status: "Rejected" });
    const list = await request(app).get("/applications").set(as(alice));
    assert.equal(list.body.find((item) => item.id === created.body.id).had_interview, true);

    const goal = await request(app).put("/me").set(as(alice)).send({ weekly_goal: 8, skills: "React, SQL" });
    assert.equal(goal.body.weekly_goal, 8);
    assert.equal(goal.body.skills, "React, SQL");
    assert.equal((await request(app).put("/me").set(as(alice)).send({ weekly_goal: 0 })).body.error, "invalid_goal");
  });

  test("a pasted posting is turned into form fields", async () => {
    const res = await request(app)
      .post("/ai/parse-posting")
      .set(as(alice))
      .send({ text: "Werkstudent Softwareentwicklung (m/w/d)\nNordlicht Software GmbH\nStandort: Jena, hybrid\n15 - 17 € pro Stunde" });
    assert.equal(res.body.source, "rules");
    assert.equal(res.body.fields.company, "Nordlicht Software GmbH");
    assert.equal(res.body.fields.salary_max, 17);
  });

  test("a pasted email proposes a status change that can be applied and undone", async () => {
    const created = await request(app)
      .post("/applications")
      .set(as(alice))
      .send({ company: "Mailhaus Systems", position: "Werkstudent Backend", status: "Applied" });
    const id = created.body.id;

    const pasted = await request(app)
      .post("/inbox")
      .set(as(alice))
      .send({
        sender: "HR <jobs@mailhaus-systems.example>",
        subject: "Ihre Bewerbung als Werkstudent Backend",
        text: "Vielen Dank für Ihre Bewerbung. Leider haben wir uns für andere Bewerber entschieden.",
      });
    assert.equal(pasted.status, 201);
    assert.equal(pasted.body.kind, "rejection");
    assert.equal(pasted.body.application_id, id);
    assert.equal(pasted.body.proposed_status, "Rejected");
    assert.equal(pasted.body.state, "pending", "nothing changes before the user agrees");
    assert.equal((await request(app).get(`/applications/${id}`).set(as(alice))).body.status, "Applied");

    const applied = await request(app).post(`/inbox/${pasted.body.id}/apply`).set(as(alice));
    assert.equal(applied.body.state, "applied");
    const after = await request(app).get(`/applications/${id}`).set(as(alice));
    assert.equal(after.body.status, "Rejected");
    const event = after.body.events.find((item) => item.to_status === "Rejected");
    assert.equal(event.auto, true, "the timeline marks the change as automatic");
    assert.equal(event.mail_kind, "rejection");

    const undone = await request(app).post(`/inbox/${pasted.body.id}/undo`).set(as(alice));
    assert.equal(undone.body.state, "pending");
    const restored = await request(app).get(`/applications/${id}`).set(as(alice));
    assert.equal(restored.body.status, "Applied");
    assert.equal(restored.body.events.some((item) => item.to_status === "Rejected"), false);
  });

  test("an invitation sets the interview date, and inbox entries are private", async () => {
    const created = await request(app)
      .post("/applications")
      .set(as(alice))
      .send({ company: "Terminwerk Labs", position: "Werkstudent", status: "Applied" });

    const pasted = await request(app)
      .post("/inbox")
      .set(as(alice))
      .send({
        sender: "talent@terminwerk.example",
        subject: "Einladung zum Vorstellungsgespräch",
        text: "Wir möchten Sie gern kennenlernen und laden Sie zu einem Gespräch am 14.07.2031 um 11:00 Uhr ein.",
      });
    assert.equal(pasted.body.kind, "interview");
    assert.equal(pasted.body.application_id, created.body.id);

    // Bob can neither see nor apply Alice's message.
    assert.equal((await request(app).get("/inbox").set(as(bob))).body.length, 0);
    assert.equal((await request(app).post(`/inbox/${pasted.body.id}/apply`).set(as(bob))).status, 404);
    assert.equal((await request(app).delete(`/inbox/${pasted.body.id}`).set(as(bob))).status, 404);

    await request(app).post(`/inbox/${pasted.body.id}/apply`).set(as(alice));
    const after = await request(app).get(`/applications/${created.body.id}`).set(as(alice));
    assert.equal(after.body.status, "Interview");
    assert.equal(after.body.interview_date, "2031-07-14T09:00:00.000Z", "11:00 in Berlin, stored as an instant");
  });

  test("unrelated mail is kept as unknown and can be dismissed", async () => {
    const pasted = await request(app)
      .post("/inbox")
      .set(as(alice))
      .send({ subject: "Newsletter", text: "Neue Angebote in unserem Shop. Jetzt entdecken und sparen!" });
    assert.equal(pasted.body.kind, "unknown");
    assert.equal(pasted.body.application_id, null);
    assert.equal((await request(app).post(`/inbox/${pasted.body.id}/apply`).set(as(alice))).status, 400);
    const dismissed = await request(app).post(`/inbox/${pasted.body.id}/dismiss`).set(as(alice));
    assert.equal(dismissed.body.state, "dismissed");
  });

  test("forwarded mail arrives through the personal address and can apply itself", async () => {
    const dana = await register("dana");
    const token = (await pool.query("SELECT inbox_token FROM users WHERE id = $1", [dana.user.id])).rows[0].inbox_token;
    assert.ok(token && token.length >= 20);

    const created = await request(app)
      .post("/applications")
      .set(as(dana))
      .send({ company: "Weiterleiter Digital", position: "Werkstudent", status: "Applied" });
    const mail = {
      From: "Recruiting <hr@weiterleiter.example>",
      Subject: "Ihre Bewerbung",
      TextBody: "Leider müssen wir Ihnen absagen, da wir uns für andere Kandidaten entschieden haben.",
    };

    // By default a forwarded mail only becomes a proposal.
    assert.equal((await request(app).post(`/inbound/${token}`).send(mail)).status, 200);
    let inbox = await request(app).get("/inbox").set(as(dana));
    assert.equal(inbox.body.length, 1);
    assert.equal(inbox.body[0].state, "pending");
    assert.equal(inbox.body[0].source, "forward");

    // With the setting on, a clear email changes the status by itself.
    assert.equal((await request(app).put("/me").set(as(dana)).send({ auto_apply: true })).body.auto_apply, true);
    await request(app).post(`/inbound/${token}`).send(mail);
    const after = await request(app).get(`/applications/${created.body.id}`).set(as(dana));
    assert.equal(after.body.status, "Rejected");

    // A wrong token gets the same answer and stores nothing.
    assert.equal((await request(app).post("/inbound/not-a-real-token").send(mail)).status, 200);
    inbox = await request(app).get("/inbox").set(as(dana));
    assert.equal(inbox.body.length, 2);
  });

  test("applying plans a follow-up, and suggested tasks are not duplicated", async () => {
    const saved = await request(app).post("/applications").set(as(alice)).send({ company: "Regelwerk", position: "Dev", status: "Saved" });
    assert.equal(saved.body.follow_up_date, null);

    const moved = await request(app).patch(`/applications/${saved.body.id}/status`).set(as(alice)).send({ status: "Applied" });
    assert.ok(moved.body.follow_up_date, "a follow-up is planned automatically");

    await request(app).post(`/applications/${saved.body.id}/tasks`).set(as(alice)).send({ titles: ["Nachfassen", "Lebenslauf prüfen"] });
    const again = await request(app).post(`/applications/${saved.body.id}/tasks`).set(as(alice)).send({ titles: ["nachfassen", "Neu"] });
    assert.deepEqual(again.body.map((task) => task.title), ["Neu"]);
  });

  test("the demo inbox holds emails that are already understood", async () => {
    const demo = await request(app).post("/auth/demo").send({ lang: "de" });
    const inbox = await request(app).get("/inbox").set("Authorization", `Bearer ${demo.body.token}`);
    assert.equal(inbox.body.length, 3);
    assert.deepEqual(inbox.body.map((mail) => mail.kind).sort(), ["confirmation", "interview", "rejection"]);
    assert.ok(inbox.body.every((mail) => mail.application_id && mail.state === "pending"));
    assert.ok(inbox.body.find((mail) => mail.kind === "interview").interview_date);
  });

  test("deleting the account removes its data", async () => {
    const carol = await register("carol");
    await request(app).post("/applications").set(as(carol)).send({ company: "Gone", position: "x" });
    assert.equal((await request(app).delete("/me").set(as(carol))).status, 204);
    assert.equal((await request(app).get("/me").set(as(carol))).status, 401);
    const left = await pool.query("SELECT 1 FROM applications WHERE company = 'Gone'");
    assert.equal(left.rowCount, 0);
  });
}
