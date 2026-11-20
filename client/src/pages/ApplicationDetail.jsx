import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft, CalendarClock, CalendarPlus, Copy, Download, ExternalLink, FileText, Mail, MapPin, Pencil, Send, Sparkles, Trash2, Wallet,
} from "lucide-react";
import { api, errorCode } from "../lib/api";
import { useApplications } from "../context/ApplicationsContext";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../i18n";
import { STATUSES, STATUS_STYLE, formatSalary, toDateInput } from "../lib/status";
import { exportInterview } from "../lib/export";
import { matchSkills } from "../lib/skills";
import { Spinner, StatusBadge } from "../components/Bits";
import { FollowUpMail, Interest, SkillMatch, Tasks } from "../components/Extras";

const Fact = ({ icon: Icon, label, children }) => (
  <div className="flex items-start gap-3">
    <span className="mt-0.5 text-muted"><Icon size={17} /></span>
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <div className="mt-0.5 break-words text-sm">{children}</div>
    </div>
  </div>
);

const Timeline = ({ events, onAddNote }) => {
  const { t, formatDateTime } = useI18n();
  const [note, setNote] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    if (!note.trim()) return;
    await onAddNote(note.trim());
    setNote("");
  };

  const describe = (item) => {
    if (item.type === "note") return item.note;
    if (item.type === "mail") return `${t(`mail.kind.${item.mail_kind}`)}: ${item.note}`;
    if (item.type === "created") return t("timeline.created", { status: t(`status.${item.to_status}`) });
    return t("timeline.moved", { from: t(`status.${item.from_status}`), to: t(`status.${item.to_status}`) });
  };

  return (
    <section className="card p-6">
      <h2 className="eyebrow mb-4">{t("timeline.title")}</h2>
      <form onSubmit={submit} className="mb-5 flex gap-2">
        <input value={note} onChange={(event) => setNote(event.target.value)} placeholder={t("timeline.placeholder")} className="input" maxLength={2000} />
        <button type="submit" className="btn-ghost !px-3" aria-label={t("timeline.add")}><Send size={16} /></button>
      </form>
      <ol className="relative space-y-5 border-l border-line pl-5">
        {events.map((item) => (
          <li key={item.id} className="relative">
            <span
              className={`absolute -left-[25.5px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-surface ${
                item.type === "note" ? "bg-muted" : STATUS_STYLE[item.to_status]?.dot || "bg-muted"
              }`}
            />
            <p className="text-sm">{describe(item)}</p>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted">
              {formatDateTime(item.created_at)}
              {item.auto && (
                <span className="rounded-full bg-accent/10 px-2 py-0.5 font-medium text-accent">{t("timeline.auto")}</span>
              )}
            </p>
          </li>
        ))}
        {events.length === 0 && <li className="text-sm text-muted">{t("timeline.empty")}</li>}
      </ol>
    </section>
  );
};

const CoverLetter = ({ application }) => {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const [letter, setLetter] = useState("");
  const [source, setSource] = useState(null);
  const [busy, setBusy] = useState(false);

  const generate = async () => {
    setBusy(true);
    try {
      const { data } = await api.post("/ai/cover-letter", {
        company: application.company,
        position: application.position,
        description: application.description,
        lang,
        name: user.is_demo ? "Max Mustermann" : undefined,
      });
      setLetter(data.letter);
      setSource(data.source);
    } catch (err) {
      toast.error(t(`error.${errorCode(err)}`));
    }
    setBusy(false);
  };

  return (
    <section className="card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="eyebrow">{t("letter.title")}</h2>
          <p className="mt-1.5 max-w-md text-sm text-muted">{t("letter.lead")}</p>
        </div>
        <button onClick={generate} disabled={busy} className="btn-ghost">
          <Sparkles size={16} /> {busy ? t("letter.working") : t(letter ? "letter.again" : "letter.generate")}
        </button>
      </div>
      {letter && (
        <div className="mt-5">
          {source === "template" && (
            <p className="mb-3 rounded-xl bg-interview/10 px-3.5 py-2.5 text-xs text-interview">{t("letter.templateNote")}</p>
          )}
          <textarea value={letter} onChange={(event) => setLetter(event.target.value)} rows={14} className="input resize-y font-sans leading-relaxed" />
          <button
            onClick={() => navigator.clipboard.writeText(letter).then(() => toast.success(t("toast.copied")))}
            className="btn-quiet mt-2"
          >
            <Copy size={15} /> {t("action.copy")}
          </button>
        </div>
      )}
    </section>
  );
};

// The page is split by what someone came to do, so only one topic is on
// screen at a time. The tab lives in the URL and can be linked to.
const TABS = ["overview", "job", "writing", "history"];

export default function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = TABS.includes(params.get("tab")) ? params.get("tab") : "overview";
  const { update, setStatus, remove, reload } = useApplications();
  const { t, formatDate, formatDateTime } = useI18n();
  const [application, setApplication] = useState(null);

  const load = useCallback(
    () =>
      api
        .get(`/applications/${id}`)
        .then(({ data }) => setApplication(data))
        .catch(() => navigate("/app", { replace: true })),
    [id, navigate]
  );

  useEffect(() => {
    load();
  }, [load]);

  if (!application) return <Spinner />;

  const changeStatus = async (event) => {
    await setStatus(application.id, event.target.value).catch(() => toast.error(t("error.generic")));
    load();
  };

  const setFollowUp = async (event) => {
    await update(application.id, {
      ...application,
      events: undefined,
      tasks: undefined,
      follow_up_date: event.target.value,
      applied_date: toDateInput(application.applied_date),
    });
    toast.success(t("toast.saved"));
    load();
  };

  const setInterest = async (interest) => {
    await update(application.id, {
      ...application,
      events: undefined,
      tasks: undefined,
      interest: interest ?? "",
      applied_date: toDateInput(application.applied_date),
      follow_up_date: toDateInput(application.follow_up_date),
    });
    load();
  };

  const refresh = () => Promise.all([load(), reload()]);

  const addNote = async (note) => {
    await api.post(`/applications/${application.id}/events`, { note });
    await Promise.all([load(), reload()]);
  };

  const downloadCv = async () => {
    const { data } = await api.get(`/applications/${application.id}/cv`, { responseType: "blob" });
    const url = URL.createObjectURL(data);
    const link = Object.assign(document.createElement("a"), { href: url, download: application.cv_name || "cv.pdf" });
    link.click();
    URL.revokeObjectURL(url);
  };

  const destroy = async () => {
    if (!window.confirm(t("confirm.delete", { company: application.company }))) return;
    await remove(application.id);
    toast.success(t("toast.deleted"));
    navigate("/app");
  };

  const salary = formatSalary(application);
  const match = matchSkills(application, user);
  const openTasks = application.tasks.filter((task) => !task.done).length;

  return (
    <div className="mx-auto max-w-5xl">
      <Link to="/app" className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft size={16} /> {t("action.backToBoard")}
      </Link>

      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <StatusBadge status={application.status} />
            <Interest value={application.interest} onChange={setInterest} />
          </div>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{application.company}</h1>
          <p className="mt-1 text-lg text-muted">{application.position}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={application.status} onChange={changeStatus} className="input !w-auto" aria-label={t("field.status")}>
            {STATUSES.map((status) => (
              <option key={status} value={status}>{t(`status.${status}`)}</option>
            ))}
          </select>
          <Link to={`/app/a/${application.id}/edit`} className="btn-ghost"><Pencil size={16} /> {t("action.edit")}</Link>
          <button onClick={destroy} className="btn-danger !px-3" aria-label={t("action.delete")}><Trash2 size={16} /></button>
        </div>
      </header>

      <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-line" role="tablist">
        {TABS.map((key) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setParams(key === "overview" ? {} : { tab: key }, { replace: true })}
            className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3.5 py-2.5 text-sm font-medium transition ${
              tab === key ? "border-accent text-ink" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {t(`tab.${key}`)}
            {key === "overview" && openTasks > 0 && <span className="rounded-full bg-sunken px-1.5 text-xs tabular-nums text-muted">{openTasks}</span>}
            {key === "job" && match && <span className="text-xs font-normal tabular-nums text-offer">{match.score} %</span>}
          </button>
        ))}
      </nav>

      {tab === "overview" && (
        <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-5">
            <section className="card grid gap-5 p-6 sm:grid-cols-2">
              <Fact icon={CalendarClock} label={t("field.applied_date")}>
                {application.applied_date ? formatDate(application.applied_date) : t("card.notSent")}
              </Fact>
              <Fact icon={MapPin} label={t("field.location")}>
                {[application.location, application.work_type && t(`workType.${application.work_type}`)].filter(Boolean).join(" · ") || "–"}
              </Fact>
              <Fact icon={Wallet} label={t("field.salary")}>{salary || "–"}</Fact>
              <Fact icon={CalendarClock} label={t("field.interview_date")}>
                {application.interview_date ? (
                  <>
                    {formatDateTime(application.interview_date)}
                    <button
                      onClick={() => exportInterview(application, t("calendar.title", { company: application.company }))}
                      className="mt-1 flex items-center gap-1.5 text-xs font-medium text-accent"
                    >
                      <CalendarPlus size={13} /> {t("calendar.add")}
                    </button>
                  </>
                ) : (
                  "–"
                )}
              </Fact>
              {(application.recruiter_name || application.recruiter_email) && (
                <Fact icon={Mail} label={t("field.recruiter_name")}>
                  {application.recruiter_name}
                  {application.recruiter_email && (
                    <a href={`mailto:${application.recruiter_email}`} className="block text-accent">{application.recruiter_email}</a>
                  )}
                </Fact>
              )}
              {application.link && (
                <Fact icon={ExternalLink} label={t("field.link")}>
                  <a href={application.link} target="_blank" rel="noreferrer" className="text-accent">{t("detail.openPosting")}</a>
                </Fact>
              )}
              {application.cv_path && (
                <Fact icon={FileText} label={t("field.cv")}>
                  <button onClick={downloadCv} className="inline-flex items-center gap-1.5 text-accent">
                    <Download size={14} /> {application.cv_name || "cv.pdf"}
                  </button>
                </Fact>
              )}
            </section>

            {application.notes && (
              <section className="card p-6">
                <h2 className="eyebrow mb-3">{t("field.notes")}</h2>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{application.notes}</p>
              </section>
            )}
          </div>

          <div className="space-y-5">
            <Tasks application={application} onChange={refresh} />
            <section className="card p-6">
              <h2 className="eyebrow mb-1.5">{t("field.follow_up_date")}</h2>
              <p className="mb-3 text-sm text-muted">{t("detail.followUpHint")}</p>
              <input type="date" value={toDateInput(application.follow_up_date)} onChange={setFollowUp} className="input" aria-label={t("field.follow_up_date")} />
              {application.status === "Applied" && <FollowUpMail application={application} />}
            </section>
          </div>
        </div>
      )}

      {tab === "job" && (
        <div className="mx-auto max-w-3xl space-y-5">
          <SkillMatch application={application} />
          {application.description ? (
            <section className="card p-6">
              <h2 className="eyebrow mb-3">{t("field.description")}</h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted">{application.description}</p>
            </section>
          ) : (
            <Link to={`/app/a/${application.id}/edit`} className="btn-ghost">
              <Pencil size={16} /> {t("detail.addDescription")}
            </Link>
          )}
        </div>
      )}

      {tab === "writing" && (
        <div className="mx-auto max-w-3xl">
          <CoverLetter application={application} />
        </div>
      )}

      {tab === "history" && (
        <div className="mx-auto max-w-3xl">
          <Timeline events={application.events} onAddNote={addNote} />
        </div>
      )}
    </div>
  );
}
