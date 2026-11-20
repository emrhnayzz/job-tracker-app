const { test } = require("node:test");
const assert = require("node:assert/strict");
const { parsePosting } = require("../lib/postingParser");

test("reads a typical German posting", () => {
  const fields = parsePosting(`
    Werkstudent Softwareentwicklung (m/w/d)
    Die Nordlicht Software GmbH entwickelt Apps für den Mittelstand.
    Standort: Jena
    Wir bieten: hybrides Arbeiten, 15 - 17 € pro Stunde
  `);
  assert.equal(fields.position, "Werkstudent Softwareentwicklung (m/w/d)");
  assert.equal(fields.company, "Nordlicht Software GmbH");
  assert.equal(fields.location, "Jena");
  assert.equal(fields.work_type, "Hybrid");
  assert.equal(fields.salary_min, 15);
  assert.equal(fields.salary_max, 17);
});

test("reads an English posting with a yearly salary", () => {
  const fields = parsePosting(`
    Working Student Frontend Developer
    Fuchsbau Studios AG, Berlin
    Fully remote. Salary: EUR 45.000 - 55.000
  `);
  assert.equal(fields.position, "Working Student Frontend Developer");
  assert.equal(fields.company, "Fuchsbau Studios AG");
  assert.equal(fields.location, "Berlin");
  assert.equal(fields.work_type, "Remote");
  assert.equal(fields.salary_min, 45000);
  assert.equal(fields.salary_max, 55000);
});

test("leaves unknown fields empty instead of guessing", () => {
  const fields = parsePosting("We are looking for someone nice to join our team soon.");
  assert.equal(fields.company, null);
  assert.equal(fields.location, null);
  assert.equal(fields.work_type, null);
  assert.equal(fields.salary_min, undefined);
});
