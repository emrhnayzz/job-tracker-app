const download = (content, filename, type) => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = Object.assign(document.createElement("a"), { href: url, download: filename });
  link.click();
  URL.revokeObjectURL(url);
};

const slug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "termin";

// All applications as a CSV file. German Excel expects semicolons, and the
// byte order mark makes it read umlauts correctly.
export const exportCsv = (applications, { t, formatDate, lang }) => {
  const separator = lang === "de" ? ";" : ",";
  const columns = [
    ["field.company", (app) => app.company],
    ["field.position", (app) => app.position],
    ["field.status", (app) => t(`status.${app.status}`)],
    ["field.applied_date", (app) => (app.applied_date ? formatDate(app.applied_date) : "")],
    ["field.location", (app) => app.location],
    ["field.work_type", (app) => (app.work_type ? t(`workType.${app.work_type}`) : "")],
    ["field.salary_min", (app) => app.salary_min],
    ["field.salary_max", (app) => app.salary_max],
    ["field.link", (app) => app.link],
    ["field.recruiter_name", (app) => app.recruiter_name],
    ["field.notes", (app) => app.notes],
  ];
  const cell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const rows = [
    columns.map(([key]) => cell(t(key))).join(separator),
    ...applications.map((app) => columns.map(([, read]) => cell(read(app))).join(separator)),
  ];
  download(`\uFEFF${rows.join("\r\n")}`, "bewerbungen.csv", "text/csv;charset=utf-8");
};

// A one-hour calendar entry for an interview, as an .ics file that every
// calendar app can open.
export const exportInterview = (application, title) => {
  const stamp = (date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const start = new Date(application.interview_date);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const escape = (text) => String(text || "").replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Zusage//Job Tracker//DE",
    "BEGIN:VEVENT",
    `UID:application-${application.id}-${stamp(start)}@zusage`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${escape(title)}`,
    `DESCRIPTION:${escape(application.position)}`,
    application.location ? `LOCATION:${escape(application.location)}` : null,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  download(lines.join("\r\n"), `${slug(application.company)}.ics`, "text/calendar;charset=utf-8");
};
