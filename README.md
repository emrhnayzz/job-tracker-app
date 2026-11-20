# Zusage – job application tracker

A full-stack web app that keeps a job search organised: every application on one board, from the saved posting to the offer. "Zusage" is the German word for a job offer.

**Live demo:** https://job-tracker-app-lez6.vercel.app/?demo=1 (opens a private sandbox with sample data, no account needed)

![The board with sample data](docs/screenshots/board.png)

## What it does

- **Kanban board** with five stages: saved, applied, interview, offer, rejected. Dragging a card changes its status, and a plus in each column adds a job in two fields.
- **Paste a posting**: paste the text of a job ad and the form fills in company, position, location, work model and pay.
- **Match**: the job description is compared with the skills in your profile, so you see what fits and what is missing. On saved jobs the score helps to decide where to apply first.
- **Tasks with suggestions**: every application has a to-do list, and each stage offers fitting next steps, for example what to prepare before an interview.
- **Timeline and reminders**: each status change is recorded. Follow-ups, due tasks and interviews of the week appear under "needs attention", with a ready-made follow-up email.
- **Weekly goal**: a target for applications per week with a progress ring.
- **Insights**: a flow diagram shows where every sent application went, next to response rate, interview rate and applications per week.
- **Cover letter draft** with Google Gemini. If the model cannot be reached, the app says so and returns a fill-in template instead.
- **Export**: all applications as CSV, interviews as calendar entries.
- **One-click demo**: every visitor gets a separate sandbox account with sample data, deleted after 24 hours.
- **German and English** interface, light and dark theme, usable on a phone.

![Insights with the flow diagram](docs/screenshots/insights.png)

| Landing page | Dark theme |
| --- | --- |
| ![Landing page](docs/screenshots/landing.png) | ![Board in dark theme](docs/screenshots/board-dark.png) |

## Tech stack

| Part | Technology |
| --- | --- |
| Frontend | React 19, Vite, Tailwind CSS, React Router, @hello-pangea/dnd, Recharts |
| Backend | Node.js, Express 5, JWT, bcrypt, Multer |
| Database | PostgreSQL |
| AI | Google Gemini API (optional) |
| Tests | Node test runner and Supertest against a real PostgreSQL database |
| Hosting | Vercel (frontend), Render (API and database) |

## How it is built

```
client/                React app
  src/pages/           Landing, sign-in, board, application form and detail, insights, profile
  src/components/      Kanban board, list view, flow diagram, tasks, match
  src/context/         Session, applications and theme state
  src/i18n/            German and English texts
  src/lib/             API client and shared helpers
server/                Express API
  routes/              auth, me, applications, ai
  middleware/          Token check and file uploads
  lib/                 Input validation, posting parser and demo data
  test/                Integration tests
```

A few decisions worth pointing out:

- **Ownership comes from the token.** The API never trusts a user id sent by the client. Every query for an application is filtered by the id inside the verified JWT, so another user's application looks exactly like one that does not exist.
- **CVs are private files.** Uploaded PDFs are not served from a public folder. They are streamed through an authenticated route to their owner only.
- **The schema script is idempotent.** The same statements create a fresh database and upgrade an existing one.
- **The demo is isolated.** Each visitor gets an account of their own, so nobody sees what someone else did in the demo.
- **The match runs in the browser.** Comparing a posting with the profile is plain keyword matching on the device, so it works without any AI service.
- **Rules first, model second.** Pasted postings are parsed by tested rules. A language model only refines the result when a key is configured, and its answer is validated before use.
- **The flow diagram is hand-drawn SVG**, about 100 lines, instead of a charting dependency.
- **Fonts are bundled**, not loaded from a third-party server.

## API overview

| Method and path | Purpose |
| --- | --- |
| `POST /auth/register`, `POST /auth/login` | Create an account, sign in |
| `POST /auth/demo` | Create a sandbox account with sample data |
| `GET /me`, `PUT /me`, `DELETE /me` | Read, update or delete the own account |
| `GET /applications`, `POST /applications` | List and create applications |
| `GET /applications/:id`, `PUT`, `DELETE` | Read (with timeline), update, delete |
| `PATCH /applications/:id/status` | Change the status (used by drag and drop) |
| `POST /applications/:id/events` | Add a note to the timeline |
| `POST /applications/:id/tasks`, `PATCH`, `DELETE` | Manage the to-do list of an application |
| `GET /applications/:id/cv` | Download the uploaded CV |
| `POST /ai/cover-letter` | Create a cover letter draft |
| `POST /ai/parse-posting` | Turn a pasted job posting into form fields |

All routes except `/auth/*` and `/health` need an `Authorization: Bearer <token>` header.

## Run it locally

Requirements: Node.js 22 or newer and a PostgreSQL database (the included `docker-compose.yml` starts one).

```bash
# 1. Database
docker compose up -d

# 2. API
cd server
cp .env.example .env
npm install
npm run dev

# 3. Frontend (in a second terminal)
cd client
npm install
npm run dev
```

The app then runs at http://localhost:5173 and the API at http://localhost:5001.

## Tests

The API tests run against a real database and wipe its tables, so they need a separate one:

```bash
cd server
TEST_DATABASE_URL=postgres://user:password@localhost:5432/jobtracker_test npm test
```

They cover registration and sign-in, rejected tokens, the separation of user data, the timeline, tasks, the demo sandbox, the posting parser, profile changes and account deletion. GitHub Actions runs them together with the frontend lint and build on every push.

## Notes

- The API runs on a free plan that sleeps when idle, so the first request after a pause can take up to 40 seconds. The app shows a notice while it waits.
- Files on that free plan do not survive a restart. For real use, uploads belong in object storage.

## About

Built by [Emirhan Ayaz](https://github.com/emrhnayzz), business informatics student in Jena.
