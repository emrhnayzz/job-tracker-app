import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  BellRing, CalendarClock, ChevronDown, Download, KanbanSquare, List, ListChecks, MailCheck, MessagesSquare, Plus, Search,
} from "lucide-react";
import { useApplications } from "../context/ApplicationsContext";
import { useI18n } from "../i18n";
import { exportCsv } from "../lib/export";
import { daysUntil, needsFollowUp, sentThisWeek } from "../lib/status";
import { useAuth } from "../context/AuthContext";
import KanbanBoard from "../components/KanbanBoard";
import ListView from "../components/ListView";
import { Spinner } from "../components/Bits";
import { ProgressRing, WeeklyGoal } from "../components/Extras";

const ICON = { interview: CalendarClock, followUp: BellRing, task: ListChecks, debrief: MessagesSquare };

// Everything that needs attention, grouped by kind.
const useAttention = (applications) =>
  useMemo(() => {
    const now = new Date();
    return {
      debrief: applications.filter((app) => app.status === "Interview" && app.interview_date && new Date(app.interview_date) < now),
      interview: applications
        .filter((app) => app.status === "Interview" && app.interview_date && new Date(app.interview_date) >= now)
        .filter((app) => daysUntil(app.interview_date) <= 7)
        .sort((a, b) => new Date(a.interview_date) - new Date(b.interview_date)),
      followUp: applications.filter(needsFollowUp),
      task: applications.filter((app) => app.open_tasks > 0 && app.next_task_due && daysUntil(app.next_task_due) <= 0),
    };
  }, [applications]);

const chipClass = "inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-sm transition";

// One calm line instead of several blocks: what is waiting today. The details
// open on demand, so the board stays the first thing on the screen.
const Today = ({ applications, pendingMails }) => {
  const { user } = useAuth();
  const { t, formatDateTime } = useI18n();
  const [open, setOpen] = useState(false);
  const groups = useAttention(applications);
  const sent = sentThisWeek(applications);
  const goal = user.weekly_goal || 5;

  const kinds = ["debrief", "interview", "followUp", "task"].filter((kind) => groups[kind].length > 0);
  const items = kinds.flatMap((kind) => groups[kind].map((app) => ({ app, kind }))).slice(0, 9);

  return (
    <section className="mb-6">
      {/* One line on a phone too: the chips scroll sideways instead of stacking. */}
      <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        {pendingMails > 0 && (
          <Link to="/app/inbox" className={`${chipClass} bg-accent/10 font-medium text-accent hover:bg-accent/20`}>
            <MailCheck size={15} /> {t("summary.mails", { count: pendingMails })}
          </Link>
        )}
        {kinds.map((kind) => {
          const Icon = ICON[kind];
          return (
            <button key={kind} onClick={() => setOpen(!open)} className={`${chipClass} bg-surface text-ink hover:bg-sunken`}>
              <Icon size={15} className="text-interview" /> {t(`summary.${kind}`, { count: groups[kind].length })}
            </button>
          );
        })}
        <button onClick={() => setOpen(!open)} className={`${chipClass} bg-surface text-ink hover:bg-sunken`}>
          <ProgressRing value={(sent / goal) * 100} size={18} stroke={3} />
          {t("summary.goal", { sent, goal })}
        </button>
        {kinds.length === 0 && pendingMails === 0 && <span className="text-sm text-muted">{t("summary.allClear")}</span>}
        <button
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="ml-auto inline-flex shrink-0 items-center gap-1 pl-2 text-sm text-muted hover:text-ink"
        >
          {t(open ? "summary.hide" : "summary.details")}
          <ChevronDown size={15} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {open && (
        <div className="rise mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <WeeklyGoal sentThisWeek={sent} />
          {items.map(({ app, kind }) => {
            const Icon = ICON[kind];
            return (
              <Link key={`${kind}-${app.id}`} to={`/app/a/${app.id}`} className="card flex items-center gap-3.5 p-4 transition hover:border-muted/50">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-interview/10 text-interview">
                  <Icon size={19} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{app.company}</span>
                  <span className="block truncate text-xs text-muted">
                    {kind === "interview" ? t("attention.interview", { when: formatDateTime(app.interview_date) }) : t(`attention.${kind}`)}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
};

const EmptyState = () => {
  const { t } = useI18n();
  return (
    <div className="card mx-auto mt-10 max-w-lg p-10 text-center">
      <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-accent/10 text-accent">
        <KanbanSquare size={26} />
      </div>
      <h2 className="font-display text-2xl font-semibold">{t("empty.title")}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted">{t("empty.text")}</p>
      <Link to="/app/new" className="btn-primary mt-6">
        <Plus size={17} /> {t("empty.action")}
      </Link>
    </div>
  );
};

export default function Dashboard() {
  const { applications, loading, setStatus, create, pendingMails } = useApplications();
  const i18n = useI18n();
  const { t } = i18n;
  const [query, setQuery] = useState("");
  const [view, setView] = useState(() => localStorage.getItem("view") || "board");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return applications;
    return applications.filter((app) =>
      [app.company, app.position, app.location].some((value) => value?.toLowerCase().includes(needle))
    );
  }, [applications, query]);

  const switchView = (next) => {
    setView(next);
    localStorage.setItem("view", next);
  };

  const move = (id, status) =>
    setStatus(id, status)
      .then(() => toast.success(t("toast.moved", { status: t(`status.${status}`) })))
      .catch(() => toast.error(t("error.generic")));

  const quickAdd = (values) =>
    create(values)
      .then(() => toast.success(t("toast.created")))
      .catch(() => toast.error(t("error.generic")));

  if (loading) return <Spinner />;
  if (applications.length === 0) return <EmptyState />;

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-3">
        <h1 className="mr-auto font-display text-2xl font-semibold tracking-tight sm:text-3xl">{t("dashboard.title")}</h1>
        <div className="relative w-full sm:w-64">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("dashboard.search")} className="input !pl-10" />
        </div>
        <button onClick={() => exportCsv(applications, i18n)} className="btn-quiet !px-2.5" title={t("dashboard.export")} aria-label={t("dashboard.export")}>
          <Download size={17} />
        </button>
        <div className="flex rounded-xl border border-line bg-surface p-1">
          {[
            ["board", KanbanSquare],
            ["list", List],
          ].map(([key, Icon]) => (
            <button
              key={key}
              onClick={() => switchView(key)}
              aria-pressed={view === key}
              aria-label={t(`view.${key}`)}
              title={t(`view.${key}`)}
              className={`rounded-lg px-2.5 py-1.5 transition ${view === key ? "bg-ink text-bg" : "text-muted hover:text-ink"}`}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>
      </div>

      <Today applications={applications} pendingMails={pendingMails} />

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted">{t("dashboard.noMatch")}</p>
      ) : view === "board" ? (
        <KanbanBoard applications={filtered} onMove={move} onAdd={quickAdd} />
      ) : (
        <ListView applications={filtered} />
      )}
    </>
  );
}
