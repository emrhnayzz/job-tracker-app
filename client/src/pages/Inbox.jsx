import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowRight, CalendarClock, Check, Copy, Forward, MailCheck, MailQuestion, Sparkles, Trash2, Undo2, X } from "lucide-react";
import { errorCode } from "../lib/api";
import { useApplications } from "../context/ApplicationsContext";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../i18n";
import { PageHeader, Spinner, StatusBadge } from "../components/Bits";

// Each kind of email borrows the colour of the stage it leads to.
const KIND_STYLE = {
  rejection: "bg-rejected/10 text-rejected",
  interview: "bg-interview/10 text-interview",
  offer: "bg-offer/10 text-offer",
  confirmation: "bg-applied/10 text-applied",
  unknown: "bg-saved/10 text-saved",
};
const SURE = 0.75;

const Message = ({ mail }) => {
  const { applications, applyMail, undoMail, dismissMail, removeMail } = useApplications();
  const { t, formatDateTime } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const [chosen, setChosen] = useState(mail.application_id || "");
  const [busy, setBusy] = useState(false);

  const run = (action, successKey) => {
    setBusy(true);
    action()
      .then(() => successKey && toast.success(t(successKey)))
      .catch((err) => toast.error(t(`error.${errorCode(err)}`)))
      .finally(() => setBusy(false));
  };

  const application = applications.find((item) => item.id === Number(chosen));
  const pending = mail.state === "pending";
  const understood = mail.kind !== "unknown";

  return (
    <article className={`card p-5 ${mail.state === "dismissed" ? "opacity-60" : ""}`}>
      <header className="flex flex-wrap items-center gap-2 text-xs">
        <span className={`rounded-full px-2.5 py-1 font-semibold ${KIND_STYLE[mail.kind]}`}>{t(`mail.kind.${mail.kind}`)}</span>
        {understood && (
          <span className="text-muted">{t(mail.confidence >= SURE ? "inbox.sure" : "inbox.unsure")}</span>
        )}
        <span className="ml-auto text-muted">
          {t(`inbox.source.${mail.source}`)} · {formatDateTime(mail.created_at)}
        </span>
      </header>

      <h2 className="mt-3 font-semibold leading-snug">{mail.subject || t("inbox.noSubject")}</h2>
      {mail.sender && <p className="text-sm text-muted">{mail.sender}</p>}
      <p className={`mt-2 text-sm leading-relaxed text-muted ${expanded ? "whitespace-pre-wrap" : "line-clamp-2"}`}>
        {expanded ? mail.body : mail.body?.replace(/\s+/g, " ")}
      </p>
      <button onClick={() => setExpanded(!expanded)} className="mt-1 text-xs font-medium text-accent">
        {t(expanded ? "inbox.less" : "inbox.more")}
      </button>

      {understood && (
        <div className="mt-4 rounded-xl bg-sunken/70 p-3.5">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
            <Sparkles size={13} /> {t(pending ? "inbox.proposal" : mail.state === "applied" ? "inbox.applied" : "inbox.dismissed")}
          </p>
          {pending ? (
            <select value={chosen} onChange={(event) => setChosen(event.target.value)} className="input mb-2.5" aria-label={t("inbox.chooseApplication")}>
              <option value="">{t("inbox.chooseApplication")}</option>
              {applications.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.company} · {item.position}
                </option>
              ))}
            </select>
          ) : (
            mail.company && (
              <Link to={`/app/a/${mail.application_id}`} className="mb-2 block text-sm font-semibold hover:text-accent">
                {mail.company} <span className="font-normal text-muted">· {mail.position}</span>
              </Link>
            )
          )}

          <div className="flex flex-wrap items-center gap-2 text-sm">
            {pending && application && mail.proposed_status && application.status !== mail.proposed_status && (
              <>
                <StatusBadge status={application.status} />
                <ArrowRight size={15} className="text-muted" />
                <StatusBadge status={mail.proposed_status} />
              </>
            )}
            {pending && application && (!mail.proposed_status || application.status === mail.proposed_status) && (
              <span className="text-muted">{t("inbox.noStatusChange")}</span>
            )}
            {!pending && mail.state === "applied" && mail.previous_status && mail.proposed_status && (
              <>
                <StatusBadge status={mail.previous_status} />
                <ArrowRight size={15} className="text-muted" />
                <StatusBadge status={mail.proposed_status} />
              </>
            )}
            {!pending && mail.state === "applied" && !mail.proposed_status && <span className="text-muted">{t("inbox.logged")}</span>}
            {mail.interview_date && (
              <span className="flex items-center gap-1.5 font-medium text-interview">
                <CalendarClock size={15} /> {formatDateTime(mail.interview_date)}
              </span>
            )}
          </div>
        </div>
      )}

      <footer className="mt-4 flex flex-wrap items-center gap-2">
        {pending && understood && (
          <button onClick={() => run(() => applyMail(mail.id, Number(chosen)), "toast.mailApplied")} disabled={busy || !chosen} className="btn-primary">
            <Check size={16} /> {t("inbox.apply")}
          </button>
        )}
        {pending && (
          <button onClick={() => run(() => dismissMail(mail.id))} disabled={busy} className="btn-ghost">
            <X size={16} /> {t("inbox.dismiss")}
          </button>
        )}
        {mail.state === "applied" && (
          <button onClick={() => run(() => undoMail(mail.id), "toast.mailUndone")} disabled={busy} className="btn-ghost">
            <Undo2 size={16} /> {t("inbox.undo")}
          </button>
        )}
        <button onClick={() => run(() => removeMail(mail.id))} disabled={busy} className="btn-quiet ml-auto !px-2.5" aria-label={t("action.delete")}>
          <Trash2 size={15} />
        </button>
      </footer>
    </article>
  );
};

const PasteMail = () => {
  const { pasteMail } = useApplications();
  const { t } = useI18n();
  const [form, setForm] = useState({ sender: "", subject: "", text: "" });
  const [busy, setBusy] = useState(false);
  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const submit = (event) => {
    event.preventDefault();
    setBusy(true);
    pasteMail(form)
      .then((mail) => {
        toast.success(t(mail.kind === "unknown" ? "toast.mailUnknown" : "toast.mailRead"));
        setForm({ sender: "", subject: "", text: "" });
      })
      .catch((err) => toast.error(t(`error.${errorCode(err)}`)))
      .finally(() => setBusy(false));
  };

  return (
    <form onSubmit={submit} className="card space-y-3 p-5">
      <h2 className="eyebrow">{t("inbox.pasteTitle")}</h2>
      <p className="text-sm text-muted">{t("inbox.pasteLead")}</p>
      <input name="sender" value={form.sender} onChange={change} placeholder={t("inbox.sender")} className="input" maxLength={255} />
      <input name="subject" value={form.subject} onChange={change} placeholder={t("inbox.subject")} className="input" maxLength={500} />
      <textarea name="text" value={form.text} onChange={change} rows={6} placeholder={t("inbox.text")} className="input resize-y" required minLength={20} />
      <button type="submit" disabled={busy || form.text.trim().length < 20} className="btn-primary w-full">
        <MailCheck size={16} /> {t(busy ? "inbox.reading" : "inbox.read")}
      </button>
    </form>
  );
};

const Forwarding = () => {
  const { user } = useAuth();
  const { t } = useI18n();
  return (
    <section className="card p-5">
      <h2 className="eyebrow mb-2 flex items-center gap-2"><Forward size={14} /> {t("inbox.forwardTitle")}</h2>
      <p className="text-sm text-muted">{t("inbox.forwardLead")}</p>
      {user.inbox_address ? (
        <button
          onClick={() => navigator.clipboard.writeText(user.inbox_address).then(() => toast.success(t("toast.copied")))}
          className="mt-3 flex w-full items-center justify-between gap-2 rounded-xl border border-line bg-sunken/60 px-3.5 py-2.5 text-left font-mono text-xs hover:border-accent"
        >
          <span className="truncate">{user.inbox_address}</span>
          <Copy size={14} className="shrink-0 text-muted" />
        </button>
      ) : (
        <p className="mt-3 rounded-xl bg-sunken/60 px-3.5 py-2.5 text-xs text-muted">{t("inbox.forwardOff")}</p>
      )}
      <Link to="/app/profile" className="mt-3 inline-block text-xs font-medium text-accent">{t("inbox.settings")}</Link>
    </section>
  );
};

export default function Inbox() {
  const { inbox, loading } = useApplications();
  const { t } = useI18n();
  if (loading) return <Spinner />;

  return (
    <>
      <PageHeader eyebrow={t("inbox.eyebrow")} title={t("inbox.title")} />
      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          {inbox.length === 0 ? (
            <div className="card p-10 text-center">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-accent/10 text-accent">
                <MailQuestion size={26} />
              </div>
              <h2 className="font-display text-2xl font-semibold">{t("inbox.emptyTitle")}</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted">{t("inbox.emptyText")}</p>
            </div>
          ) : (
            inbox.map((mail) => <Message key={mail.id} mail={mail} />)
          )}
        </div>
        <div className="space-y-4">
          <PasteMail />
          <Forwarding />
        </div>
      </div>
    </>
  );
}
