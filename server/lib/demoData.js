// Sample data for the one-click demo. All companies are invented.
// `applied`, `followUp`, `interview` and task `due` are day offsets from today.
const DEMO_SKILLS =
  "React Native, TypeScript, JavaScript, React, Swift, SwiftUI, Node.js, PostgreSQL, Supabase, Git, REST";

const DEMO_APPLICATIONS = [
  {
    company: "Nordlicht Software",
    position: "Werkstudent Softwareentwicklung (m/w/d)",
    status: "Interview",
    interest: 3,
    applied: -12,
    interview: 3,
    work_type: "Hybrid",
    location: "Jena",
    salary_min: 15,
    salary_max: 17,
    recruiter_name: "Jana Lindner",
    description:
      "Du entwickelst mit uns Web- und Mobile-Anwendungen mit React, TypeScript und Node.js. Erfahrung mit Git, REST-APIs und PostgreSQL ist von Vorteil. Wir arbeiten agil nach Scrum und nutzen Docker und CI/CD.",
    notes: {
      de: "Zweites Gespräch mit dem Teamlead. Vorher die eigene App als Demo vorbereiten.",
      en: "Second interview with the team lead. Prepare a demo of my own app beforehand.",
    },
    tasks: [
      { de: "Unternehmen und Produkte recherchieren", en: "Research the company and its products", done: true },
      { de: "Eigene App als Demo vorbereiten", en: "Prepare a demo of my own app", due: 2 },
      { de: "Drei Fragen an das Team notieren", en: "Write down three questions for the team", due: 2 },
    ],
    history: [{ at: -12, to: "Applied" }, { at: -5, from: "Applied", to: "Interview" }],
  },
  {
    company: "Saalewerk Digital",
    position: "Werkstudent Mobile Development (m/w/d)",
    status: "Interview",
    interest: 3,
    applied: -9,
    interview: 6,
    work_type: "Remote",
    location: "Leipzig",
    salary_min: 16,
    salary_max: 18,
    description:
      "Für unser Mobile-Team suchen wir Unterstützung in React Native und TypeScript. Kenntnisse in Swift oder Kotlin, Firebase und im Release-Prozess für App Store und Google Play sind willkommen.",
    notes: {
      de: "Technisches Gespräch per Video. Fragen zu React Native und App-Store-Releases erwartet.",
      en: "Technical video call. Expect questions on React Native and App Store releases.",
    },
    tasks: [{ de: "Release-Ablauf der eigenen Apps zusammenfassen", en: "Summarise how I release my own apps", due: 5 }],
    history: [{ at: -9, to: "Applied" }, { at: -2, from: "Applied", to: "Interview" }],
  },
  {
    company: "Kernberg Analytics",
    position: "Werkstudent Produktmanagement (m/w/d)",
    status: "Offer",
    interest: 2,
    applied: -30,
    work_type: "Hybrid",
    location: "Jena",
    salary_min: 16,
    salary_max: 16,
    recruiter_name: "Tobias Brandt",
    description:
      "Du unterstützt das Produktmanagement: Anforderungen aufnehmen, User Stories schreiben, Daten mit SQL und Excel auswerten. Wir arbeiten mit Jira und Figma.",
    notes: {
      de: "Angebot liegt vor: 16 € pro Stunde, 18 Stunden pro Woche. Antwort bis Freitag.",
      en: "Offer received: €16 per hour, 18 hours per week. Reply due by Friday.",
    },
    tasks: [{ de: "Angebot beantworten", en: "Reply to the offer", due: 2 }],
    history: [
      { at: -30, to: "Applied" },
      { at: -21, from: "Applied", to: "Interview" },
      { at: -2, from: "Interview", to: "Offer" },
    ],
  },
  {
    company: "Lumen Robotics",
    position: "Werkstudent KI & Automatisierung (m/w/d)",
    status: "Applied",
    interest: 2,
    applied: -17,
    followUp: -3,
    work_type: "On-site",
    location: "Erfurt",
    description:
      "Automatisierung interner Abläufe mit Python und LLM-APIs. Du baust Prototypen und integrierst KI-Dienste über REST. Kenntnisse in SQL, Docker und Git sind hilfreich.",
    notes: {
      de: "Seit über zwei Wochen keine Antwort. Freundlich nachfassen.",
      en: "No reply for more than two weeks. Send a friendly follow-up.",
    },
    history: [{ at: -17, to: "Applied" }],
  },
  {
    company: "Fuchsbau Studios",
    position: "Werkstudent Frontend (React)",
    status: "Applied",
    interest: 2,
    applied: -6,
    followUp: 1,
    work_type: "Remote",
    location: "Berlin",
    salary_min: 15,
    salary_max: 19,
    description:
      "Frontend mit React, TypeScript, Tailwind CSS und Next.js. Du setzt Designs aus Figma um und schreibst Tests mit Jest.",
    history: [{ at: -6, to: "Applied" }],
  },
  {
    company: "Thüringer Datenhaus",
    position: "Werkstudent IT-Consulting (m/w/d)",
    status: "Applied",
    interest: 1,
    applied: -4,
    work_type: "Hybrid",
    location: "Weimar",
    description:
      "Unterstützung in Kundenprojekten: Prozesse analysieren, Auswertungen mit SAP und Power BI erstellen, Dokumentation in Confluence. SQL-Kenntnisse erwünscht.",
    history: [{ at: -4, to: "Applied" }],
  },
  {
    company: "Blaupause Cloud",
    position: "Werkstudent Backend (Node.js)",
    status: "Applied",
    interest: 1,
    applied: -2,
    work_type: "Remote",
    location: "München",
    salary_min: 17,
    salary_max: 20,
    description:
      "Backend-Entwicklung mit Node.js, Express und PostgreSQL in der AWS-Cloud. Docker, Kubernetes und CI/CD gehören zum Alltag.",
    history: [{ at: -2, to: "Applied" }],
  },
  {
    company: "Optikhain",
    position: "Werkstudent Softwaretest (m/w/d)",
    status: "Rejected",
    applied: -26,
    work_type: "On-site",
    location: "Jena",
    notes: {
      de: "Absage nach dem ersten Gespräch. Feedback: mehr Erfahrung mit Testautomatisierung gewünscht.",
      en: "Rejected after the first interview. Feedback: more test automation experience wanted.",
    },
    history: [
      { at: -26, to: "Applied" },
      { at: -18, from: "Applied", to: "Interview" },
      { at: -11, from: "Interview", to: "Rejected" },
    ],
  },
  {
    company: "Hanse Fintech",
    position: "Werkstudent Web Development",
    status: "Rejected",
    applied: -34,
    work_type: "Remote",
    location: "Hamburg",
    history: [{ at: -34, to: "Applied" }, { at: -20, from: "Applied", to: "Rejected" }],
  },
  {
    company: "Paradies Mobility",
    position: "Werkstudent iOS-Entwicklung (Swift)",
    status: "Saved",
    interest: 3,
    work_type: "Hybrid",
    location: "Jena",
    salary_min: 16,
    salary_max: 18,
    description:
      "Du arbeitest an unserer iOS-App mit Swift und SwiftUI. Erfahrung mit Xcode, Git, REST-APIs und Unit-Tests wird erwartet; Kenntnisse in Combine und CI/CD sind ein Plus.",
    notes: {
      de: "Passt sehr gut zum Profil. Anschreiben auf SwiftUI-Projekte ausrichten.",
      en: "Strong match. Focus the cover letter on my SwiftUI projects.",
    },
    tasks: [{ de: "Anschreiben schreiben", en: "Write the cover letter", due: 1 }],
    history: [],
  },
  {
    company: "Grünstrom Systems",
    position: "Werkstudent Digitalisierung (m/w/d)",
    status: "Saved",
    interest: 1,
    work_type: "On-site",
    location: "Gera",
    description:
      "Digitalisierung interner Prozesse mit Power Automate, Excel und SQL. Erfahrung mit Python ist ein Plus.",
    history: [],
  },
  {
    company: "Zeitfenster Labs",
    position: "Werkstudent Full-Stack (m/w/d)",
    status: "Saved",
    interest: 2,
    work_type: "Remote",
    location: "Köln",
    salary_min: 18,
    salary_max: 21,
    description:
      "Full-Stack mit React, Node.js, TypeScript und PostgreSQL. Wir nutzen Supabase und GitHub Actions und arbeiten agil.",
    history: [],
  },
];

const daysFromNow = (offset) => {
  const day = new Date();
  day.setHours(10, 0, 0, 0);
  day.setDate(day.getDate() + offset);
  return day;
};
const optionalDay = (offset) => (offset === undefined ? null : daysFromNow(offset));

const seedDemoApplications = async (client, userId, lang) => {
  for (const app of DEMO_APPLICATIONS) {
    const inserted = await client.query(
      `INSERT INTO applications
         (user_id, company, position, status, applied_date, follow_up_date, interview_date, work_type, location,
          salary_min, salary_max, currency, recruiter_name, notes, description, interest, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'EUR',$12,$13,$14,$15,$16)
       RETURNING id`,
      [
        userId,
        app.company,
        app.position,
        app.status,
        optionalDay(app.applied),
        optionalDay(app.followUp),
        optionalDay(app.interview),
        app.work_type,
        app.location,
        app.salary_min ?? null,
        app.salary_max ?? null,
        app.recruiter_name ?? null,
        app.notes ? app.notes[lang] : null,
        app.description ?? null,
        app.interest ?? null,
        daysFromNow(app.applied ?? -1),
      ]
    );
    const applicationId = inserted.rows[0].id;

    for (const step of app.history) {
      await client.query(
        `INSERT INTO application_events (application_id, type, from_status, to_status, created_at)
         VALUES ($1,$2,$3,$4,$5)`,
        [applicationId, step.from ? "status" : "created", step.from ?? null, step.to, daysFromNow(step.at)]
      );
    }
    for (const task of app.tasks ?? []) {
      await client.query(
        "INSERT INTO application_tasks (application_id, title, done, due_date) VALUES ($1,$2,$3,$4)",
        [applicationId, task[lang], Boolean(task.done), optionalDay(task.due)]
      );
    }
  }
};

module.exports = { seedDemoApplications, DEMO_APPLICATIONS, DEMO_SKILLS };
