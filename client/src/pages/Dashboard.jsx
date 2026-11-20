import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { BellRing, CalendarClock, Download, KanbanSquare, List, ListChecks, Plus, Search } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useApplications } from "../context/ApplicationsContext";
import { useI18n } from "../i18n";
import { exportCsv } from "../lib/export";
import { computeStats, daysUntil, needsFollowUp, sentThisWeek } from "../lib/status";
import KanbanBoard from "../components/KanbanBoard";
import ListView from "../components/ListView";
import { PageHeader, Spinner } from "../components/Bits";
import { WeeklyGoal } from "../components/Extras";

const Stat = ({ label, value, hint }) => (
  <div className="card p-5">
    <p className="eyebrow">{label}</p>
    <p className="mt-2 font-display text-4xl font-semibold tabular-nums tracking-tight">{value}</p>
    {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
  </div>
);

const ATTENTION_ICON = { interview: CalendarClock, followUp: BellRing, task: ListChecks };

// What needs attention now: interviews this week, follow-ups and tasks that are due.
const Attention = ({ applications }) => {
  const { t, formatDateTime } = useI18n();
  const items = useMemo(() => {
    const interviews = applications
      .filter((app) => app.status === "Interview" && app.interview_date)
      .map((app) => ({ app, days: daysUntil(app.interview_date) }))
      .filter(({ days }) => days >= 0 && days <= 7)
      .sort((a, b) => a.days - b.days)
      .map(({ app }) => ({ app, kind: "interview" }));
    const followUps = applications.filter(needsFollowUp).map((app) => ({ app, kind: "followUp" }));
    const tasks = applications
      .filter((app) => app.open_tasks > 0 && app.next_task_due && daysUntil(app.next_task_due) <= 0)
      .map((app) => ({ app, kind: "task" }));
    return [...interviews, ...followUps, ...tasks].slice(0, 6);
  }, [applications]);

  if (items.length === 0) return null;
  return (
    <section className="mb-8">
      <h2 className="eyebrow mb-3">{t("attention.title")}</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map(({ app, kind }) => {
          const Icon = ATTENTION_ICON[kind];
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
    </section>
  );
};

const EmptyState = () => {
  const { t } = useI18n();
  return (
    <div className="card mx-auto max-w-lg p-10 text-center">
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
  const { user } = useAuth();
  const { applications, loading, setStatus, create } = useApplications();
  const i18n = useI18n();
  const { t } = i18n;
  const [query, setQuery] = useState("");
  const [view, setView] = useState(() => localStorage.getItem("view") || "board");

  const stats = useMemo(() => computeStats(applications), [applications]);
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

  return (
    <>
      <PageHeader
        eyebrow={user.is_demo ? t("demo.eyebrow") : t("dashboard.eyebrow", { name: user.username })}
        title={t("dashboard.title")}
      />

      {applications.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <section className="mb-8 grid grid-cols-2 gap-3 xl:grid-cols-6">
            <div className="col-span-2">
              <WeeklyGoal sentThisWeek={sentThisWeek(applications)} />
            </div>
            <Stat label={t("stat.active")} value={stats.active} />
            <Stat label={t("stat.interviews")} value={stats.interviews} />
            <Stat label={t("stat.offers")} value={stats.offers} />
            <Stat label={t("stat.responseRate")} value={stats.responseRate === null ? "–" : `${stats.responseRate} %`} />
          </section>

          <Attention applications={applications} />

          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
              <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("dashboard.search")} className="input !pl-10" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={() => exportCsv(applications, i18n)} className="btn-ghost !px-3" title={t("dashboard.export")} aria-label={t("dashboard.export")}>
                <Download size={16} /> <span className="hidden sm:inline">CSV</span>
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
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                      view === key ? "bg-ink text-bg" : "text-muted hover:text-ink"
                    }`}
                  >
                    <Icon size={16} /> {t(`view.${key}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted">{t("dashboard.noMatch")}</p>
          ) : view === "board" ? (
            <KanbanBoard applications={filtered} onMove={move} onAdd={quickAdd} />
          ) : (
            <ListView applications={filtered} />
          )}
        </>
      )}
    </>
  );
}
