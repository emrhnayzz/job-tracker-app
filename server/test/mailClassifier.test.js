const { test } = require("node:test");
const assert = require("node:assert/strict");
const { classifyMail, matchApplication, proposedStatus, findDate } = require("../lib/mailClassifier");

const NOW = new Date("2026-11-20T12:00:00Z");
const options = { now: NOW, timeZone: "Europe/Berlin" };

test("a German rejection wins over its polite opening", () => {
  const result = classifyMail({
    subject: "Ihre Bewerbung als Werkstudent Frontend",
    text: "Guten Tag, vielen Dank für Ihre Bewerbung. Leider müssen wir Ihnen mitteilen, dass wir uns für andere Bewerber entschieden haben. Wir wünschen Ihnen für Ihren weiteren Weg alles Gute.",
  });
  assert.equal(result.kind, "rejection");
  assert.ok(result.confidence >= 0.75, `confidence ${result.confidence}`);
});

test("an English rejection is recognised", () => {
  const result = classifyMail({
    subject: "Update on your application",
    text: "Thank you for applying. Unfortunately, we have decided not to move forward and will be not moving forward with your application.",
  });
  assert.equal(result.kind, "rejection");
});

test("an invitation is recognised and its date is read in German time", () => {
  const result = classifyMail(
    {
      subject: "Einladung zum Vorstellungsgespräch",
      text: "Gern möchten wir Sie persönlich kennenlernen und laden Sie zu einem Gespräch am 25.11.2026 um 14:00 Uhr per Teams ein. Passt Ihnen der Termin?",
    },
    options
  );
  assert.equal(result.kind, "interview");
  // 14:00 in Berlin in winter is 13:00 UTC.
  assert.equal(result.interviewDate.toISOString(), "2026-11-25T13:00:00.000Z");
});

test("dates are read in several spellings", () => {
  assert.equal(findDate("am 3. Dezember um 10 Uhr", options).toISOString(), "2026-12-03T09:00:00.000Z");
  assert.equal(findDate("on December 3, 2026 at 2:30 pm", options).toISOString(), "2026-12-03T13:30:00.000Z");
  assert.equal(findDate("Termin: 05.01. 09:15", options).toISOString(), "2027-01-05T08:15:00.000Z", "a past day means next year");
  assert.equal(findDate("am 14.07.2027 um 11:00 Uhr", options).toISOString(), "2027-07-14T09:00:00.000Z", "summer time");
  assert.equal(findDate("no date in here", options), null);
});

test("an offer is recognised, and 'keine Zusage' is not one", () => {
  const offer = classifyMail({
    subject: "Ihre Bewerbung",
    text: "Wir freuen uns, Ihnen die Stelle anbieten zu können. Den Arbeitsvertrag senden wir Ihnen in den nächsten Tagen. Willkommen im Team!",
  });
  assert.equal(offer.kind, "offer");

  const noOffer = classifyMail({
    subject: "Ihre Bewerbung",
    text: "Leider können wir Ihnen keine Zusage geben, da wir uns für andere Kandidaten entschieden haben.",
  });
  assert.equal(noOffer.kind, "rejection");
});

test("a confirmation of receipt is recognised", () => {
  const result = classifyMail({
    subject: "Eingangsbestätigung Ihrer Bewerbung",
    text: "Wir haben Ihre Bewerbung erhalten und prüfen Ihre Unterlagen. Wir melden uns in Kürze bei Ihnen.",
  });
  assert.equal(result.kind, "confirmation");
});

test("unrelated mail stays unknown", () => {
  const result = classifyMail({ subject: "Newsletter November", text: "Neue Angebote in unserem Shop. Jetzt entdecken!" });
  assert.equal(result.kind, "unknown");
  assert.equal(result.confidence, 0);
});

test("the matching application is found by sender and by name", () => {
  const applications = [
    { id: 1, company: "Nordlicht Software", position: "Werkstudent Softwareentwicklung (m/w/d)", status: "Applied" },
    { id: 2, company: "Fuchsbau Studios", position: "Werkstudent Frontend (React)", status: "Applied" },
    { id: 3, company: "Thüringer Datenhaus", position: "Werkstudent IT-Consulting (m/w/d)", status: "Applied" },
  ];
  const bySender = matchApplication({ sender: "Recruiting <jobs@fuchsbau-studios.de>", subject: "Ihre Bewerbung", text: "Guten Tag" }, applications);
  assert.equal(bySender.id, 2);

  const byName = matchApplication({ sender: "hr@personaldienst.example", subject: "Bewerbung", text: "Ihre Bewerbung bei der Nordlicht Software GmbH" }, applications);
  assert.equal(byName.id, 1);

  const umlaut = matchApplication({ sender: "bewerbung@thueringer-datenhaus.de", subject: "Eingang", text: "Danke" }, applications);
  assert.equal(umlaut.id, 3);

  assert.equal(matchApplication({ sender: "news@shop.example", subject: "Angebote", text: "Software im Angebot" }, applications), null);

  // Short or generic names must not match by accident.
  const tricky = [{ id: 9, company: "R", position: "D", status: "Applied" }, ...applications];
  const stillRight = matchApplication({ sender: "jobs@fuchsbau-studios.de", subject: "Einladung", text: "Wir laden Sie herzlich ein." }, tricky);
  assert.equal(stillRight.id, 2);
});

test("the proposed status follows the email", () => {
  assert.equal(proposedStatus("rejection", "Applied"), "Rejected");
  assert.equal(proposedStatus("interview", "Applied"), "Interview");
  assert.equal(proposedStatus("offer", "Interview"), "Offer");
  assert.equal(proposedStatus("confirmation", "Saved"), "Applied");
  assert.equal(proposedStatus("confirmation", "Applied"), null);
  assert.equal(proposedStatus("unknown", "Applied"), null);
});
