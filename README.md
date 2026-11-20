# Zusage – job application tracker

A full-stack web app that keeps a job search organised: every application on one board, from the saved posting to the offer. "Zusage" is the German word for a job offer.

**Live demo:** https://job-tracker-app-lez6.vercel.app/?demo=1 (opens a private sandbox with sample data, no account needed)

![The board with sample data](docs/screenshots/board.png)

## What it does

- **Kanban board** with five stages: saved, applied, interview, offer, rejected. Dragging a card changes its status, and a plus in each column adds a job in two fields.
- **An inbox that updates the board**: paste or forward a reply from a company and the app works out what it is (confirmation of receipt, interview invitation, rejection or offer), finds the application it belongs to, reads the interview date and proposes the status change. One click applies it, another undoes it.
- **Paste a posting**: paste the text of a job ad and the form fills in company, position, location, work model and pay.
- **Read my CV**: pick your CV as a PDF and the app finds your skills in it and fills the profile. The file is read in the browser and never uploaded; only the skills you keep are saved.
- **Match**: the job description is compared with the skills in your profile, so you see what fits and what is missing. On saved jobs the score helps to decide where to apply first.
- **Tasks that appear by themselves**: when an application changes its stage, the fitting next steps are added to its to-do list, and applying plans a follow-up ten days later. Both can be switched off.
- **Timeline and reminders**: each status change is recorded. Follow-ups, due tasks and interviews of the week appear under "needs attention", with a ready-made follow-up email.
- **Weekly goal**: a target for applications per week with a progress ring.
- **Insights**: a flow diagram shows where every sent application went, next to response rate, interview rate and applications per week.
- **Cover letter draft** with Google Gemini. If the model cannot be reached, the app says so and returns a fill-in template instead.
- **Export**: all applications as CSV, interviews as calendar entries.
- **One-click demo**: every visitor gets a separate sandbox account with sample data, deleted after 24 hours.
- **German and English** interface, light and dark theme, usable on a phone.

![The inbox with three emails that are already understood](docs/screenshots/inbox.png)

![Insights with the flow diagram](docs/screenshots/insights.png)

| Landing page | Dark theme |
| --- | --- |
| ![Landing page](docs/screenshots/landing.png) | ![Board in dark theme](docs/screenshots/board-dark.png) |

## Tech stack

| Part | Technology |
| --- | --- |
| Frontend | React 19, Vite, Tailwind CSS, React Router, @hello-pangea/dnd, Recharts, pdf.js |
| Backend | Node.js, Express 5, JWT, bcrypt, Multer |
| Database | PostgreSQL |
| AI | Google Gemini API (optional) |
| Tests | Node test runner and Supertest against a real PostgreSQL database |
| Hosting | Vercel (frontend), Render (API and database) |

## How it is built

```
client/                React app
  src/pages/           Landing, sign-in, board, inbox, application form and detail, insights, profile
  src/components/      Kanban board, list view, flow diagram, tasks, match
  src/context/         Session, applications and theme state
  src/i18n/            German and English texts
  src/lib/             API client and shared helpers
server/                Express API
  routes/              auth, me, applications, inbox, ai
  middleware/          Token check and file uploads
  lib/                 Email classifier and processor, posting parser, rules, demo data
  test/                Integration tests
```

A few decisions worth pointing out:

- **Ownership comes from the token.** The API never trusts a user id sent by the client. Every query for an application is filtered by the id inside the verified JWT, so another user's application looks exactly like one that does not exist.
- **CVs are private files.** Uploaded PDFs are not served from a public folder. They are streamed through an authenticated route to their owner only.
- **The schema script is idempotent.** The same statements create a fresh database and upgrade an existing one.
- **The demo is isolated.** Each visitor gets an account of their own, so nobody sees what someone else did in the demo.
- **Email automation without mailbox access.** The app never connects to a mailbox. It only reads what a user pastes or forwards to a personal address, which keeps the privacy story simple and avoids the review that reading a Gmail inbox would need.
- **Automation proposes, the user decides.** An email only changes a status by itself when the user allowed it and the classifier is confident. Every automatic change is labelled in the timeline and can be undone.
- **The classifier is rules, not a model.** Weighted German and English phrases decide what an email is, so the result can be explained and tested, and no email text is sent to a third party.
- **Times are instants.** "14:00 Uhr" in an email is read in the configured time zone and stored with a zone, so it shows correctly wherever the server runs.
- **The CV never leaves the device.** PDF text is extracted in the browser with pdf.js, loaded only when a file is picked, so the main bundle stays small and no personal document is stored.
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
| `GET /inbox`, `POST /inbox` | List emails, paste one for analysis |
| `POST /inbox/:id/apply`, `/undo`, `/dismiss` | Apply a proposal, take it back, ignore it |
| `POST /inbound/:token` | Webhook for forwarded emails (Postmark, Mailgun and SendGrid field names) |
| `POST /ai/cover-letter` | Create a cover letter draft |
| `POST /ai/parse-posting` | Turn a pasted job posting into form fields |

All routes except `/auth/*`, `/inbound/*` and `/health` need an `Authorization: Bearer <token>` header.

### Forwarded emails

Pasting works out of the box. For automatic forwarding, set `INBOUND_DOMAIN` and point the inbound webhook of a mail provider for that domain at `POST /inbound/<token>`. Every user then sees a personal address in the inbox page and can forward replies to it, by hand or with a filter in their mail program.

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

They cover registration and sign-in, rejected tokens, the separation of user data, the timeline, tasks, the inbox with apply and undo, forwarded mail, the email classifier and its date parsing, the posting parser, the demo sandbox, profile changes and account deletion. GitHub Actions runs them together with the frontend lint and build on every push.

## Notes

- The API runs on a free plan that sleeps when idle, so the first request after a pause can take up to 40 seconds. The app shows a notice while it waits.
- Files on that free plan do not survive a restart. For real use, uploads belong in object storage.

## About

Built by [Emirhan Ayaz](https://github.com/emrhnayzz), business informatics student in Jena.
