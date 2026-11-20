import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Check, Copy, Mail, Minus, Plus, Star, Trash2 } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../i18n";
import { matchSkills } from "../lib/skills";

// One to three stars: how much do I want this job?
export const Interest = ({ value, onChange, size = 16 }) => {
  const { t } = useI18n();
  if (!onChange) {
    if (!value) return null;
    return (
      <span className="flex items-center gap-0.5 text-interview" aria-label={t("interest.label", { value })}>
        {Array.from({ length: value }, (_, index) => (
          <Star key={index} size={size} fill="currentColor" strokeWidth={0} />
        ))}
      </span>
    );
  }
  return (
    <div className="flex items-center gap-1" role="group" aria-label={t("field.interest")}>
      {[1, 2, 3].map((level) => (
        <button
          key={level}
          type="button"
          onClick={() => onChange(value === level ? null : level)}
          aria-pressed={value >= level}
          aria-label={t("interest.label", { value: level })}
          className={`rounded p-0.5 transition hover:scale-110 ${value >= level ? "text-interview" : "text-line hover:text-muted"}`}
        >
          <Star size={size} fill={value >= level ? "currentColor" : "none"} />
        </button>
      ))}
    </div>
  );
};

// How well the profile matches what the posting asks for.
export const SkillMatch = ({ application }) => {
  const { user } = useAuth();
  const { t } = useI18n();
  const match = matchSkills(application, user);

  return (
    <section className="card p-6">
      <h2 className="eyebrow mb-4">{t("match.title")}</h2>
      {!match ? (
        <p className="text-sm text-muted">{t("match.noPosting")}</p>
      ) : (
        <>
          <div className="flex items-center gap-4">
            <ProgressRing value={match.score} size={64}>
              <span className="text-sm font-semibold tabular-nums">{match.score}%</span>
            </ProgressRing>
            <p className="text-sm text-muted">
              {t("match.summary", { matched: match.matched.length, total: match.matched.length + match.missing.length })}
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {match.matched.map((skill) => (
              <span key={skill} className="inline-flex items-center gap-1 rounded-full bg-offer/10 px-2.5 py-1 text-xs font-medium text-offer">
                <Check size={12} /> {skill}
              </span>
            ))}
            {match.missing.map((skill) => (
              <span key={skill} className="rounded-full border border-dashed border-line px-2.5 py-1 text-xs text-muted">
                {skill}
              </span>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted">
            {match.hasProfile ? t("match.hint") : t("match.noProfile")}{" "}
            <Link to="/app/profile" className="font-medium text-accent">{t("match.editProfile")}</Link>
          </p>
        </>
      )}
    </section>
  );
};

export const ProgressRing = ({ value, size = 56, stroke = 6, children }) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = Math.min(Math.max(value, 0), 100) / 100;
  return (
    <span className="relative inline-grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className="stroke-sunken" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - filled)}
          className="stroke-accent transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <span className="absolute">{children}</span>
    </span>
  );
};

// To-dos of one application, with suggested steps for its current stage.
export const Tasks = ({ application, onChange }) => {
  const { t, formatDate } = useI18n();
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const base = `/applications/${application.id}/tasks`;

  const existing = new Set(application.tasks.map((task) => task.title));
  const suggestions = t(`tasks.suggest.${application.status}`)
    .split("|")
    .filter((suggestion) => suggestion && !existing.has(suggestion));

  const run = (request) => request.then(onChange).catch(() => toast.error(t("error.generic")));
  const add = (event) => {
    event.preventDefault();
    if (!title.trim()) return;
    run(api.post(base, { title: title.trim(), due_date: due || undefined }));
    setTitle("");
    setDue("");
  };

  return (
    <section className="card p-6">
      <h2 className="eyebrow mb-4">{t("tasks.title")}</h2>
      <ul className="space-y-1">
        {application.tasks.map((task) => (
          <li key={task.id} className="group flex items-start gap-3 rounded-lg px-1 py-1.5 hover:bg-sunken/60">
            <button
              onClick={() => run(api.patch(`${base}/${task.id}`, { done: !task.done }))}
              aria-pressed={task.done}
              aria-label={task.title}
              className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition ${
                task.done ? "border-accent bg-accent text-accent-ink" : "border-muted/50 hover:border-accent"
              }`}
            >
              {task.done && <Check size={13} strokeWidth={3} />}
            </button>
            <span className={`min-w-0 flex-1 text-sm ${task.done ? "text-muted line-through" : ""}`}>
              {task.title}
              {task.due_date && !task.done && (
                <span className="ml-2 whitespace-nowrap text-xs text-muted">
                  {formatDate(task.due_date, { day: "numeric", month: "short" })}
                </span>
              )}
            </span>
            <button
              onClick={() => run(api.delete(`${base}/${task.id}`))}
              aria-label={t("action.delete")}
              className="text-muted opacity-0 transition hover:text-rejected focus:opacity-100 group-hover:opacity-100"
            >
              <Trash2 size={14} />
            </button>
          </li>
        ))}
        {application.tasks.length === 0 && <li className="px-1 text-sm text-muted">{t("tasks.empty")}</li>}
      </ul>

      <form onSubmit={add} className="mt-4 flex flex-wrap gap-2">
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t("tasks.placeholder")} className="input basis-full" maxLength={200} />
        <input type="date" value={due} onChange={(event) => setDue(event.target.value)} className="input min-w-0 flex-1" aria-label={t("tasks.due")} />
        <button type="submit" className="btn-ghost"><Plus size={16} /> {t("tasks.add")}</button>
      </form>

      {suggestions.length > 0 && (
        <div className="mt-5 border-t border-line pt-4">
          <p className="mb-2 text-xs text-muted">{t("tasks.suggestTitle", { status: t(`status.${application.status}`) })}</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => run(api.post(base, { title: suggestion }))}
                className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-xs text-muted transition hover:border-accent hover:text-ink"
              >
                <Plus size={12} /> {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

// A ready-made follow-up email that only needs a quick look before sending.
export const FollowUpMail = ({ application }) => {
  const { user } = useAuth();
  const { t, formatDate } = useI18n();
  const [open, setOpen] = useState(false);
  const subject = t("mail.subject", { position: application.position });
  const [body, setBody] = useState(() =>
    t("mail.body", {
      contact: application.recruiter_name ? t("mail.greetingNamed", { name: application.recruiter_name }) : t("mail.greeting"),
      position: application.position,
      company: application.company,
      date: application.applied_date ? formatDate(application.applied_date) : "",
      name: user.is_demo ? "Max Mustermann" : user.username,
    })
  );

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-ghost mt-3 w-full">
        <Mail size={16} /> {t("mail.open")}
      </button>
    );
  }
  return (
    <div className="mt-4">
      <p className="mb-1.5 text-xs font-semibold text-muted">{subject}</p>
      <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={9} className="input resize-y text-sm leading-relaxed" />
      <div className="mt-2 flex flex-wrap gap-2">
        <button onClick={() => navigator.clipboard.writeText(body).then(() => toast.success(t("toast.copied")))} className="btn-quiet">
          <Copy size={15} /> {t("action.copy")}
        </button>
        <a
          href={`mailto:${application.recruiter_email || ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}
          className="btn-quiet"
        >
          <Mail size={15} /> {t("mail.send")}
        </a>
      </div>
    </div>
  );
};

// This week's applications against the weekly target.
export const WeeklyGoal = ({ sentThisWeek }) => {
  const { user, setUser } = useAuth();
  const { t } = useI18n();
  const goal = user.weekly_goal || 5;
  const reached = sentThisWeek >= goal;

  const change = (delta) => {
    const next = Math.min(Math.max(goal + delta, 1), 50);
    if (next === goal) return;
    setUser({ ...user, weekly_goal: next });
    api.put("/me", { weekly_goal: next }).catch(() => setUser(user));
  };

  return (
    <div className="card flex items-center gap-4 p-5">
      <ProgressRing value={(sentThisWeek / goal) * 100} size={68} stroke={7}>
        <span className="font-display text-xl font-semibold tabular-nums">{sentThisWeek}</span>
      </ProgressRing>
      <div className="min-w-0">
        <p className="eyebrow">{t("goal.title")}</p>
        <p className="mt-1 text-sm font-medium">{reached ? t("goal.reached") : t("goal.progress", { sent: sentThisWeek, goal })}</p>
        <div className="mt-1.5 flex items-center gap-1 text-xs text-muted">
          <button onClick={() => change(-1)} className="rounded border border-line p-0.5 hover:text-ink" aria-label={t("goal.less")}><Minus size={12} /></button>
          <span className="tabular-nums">{t("goal.target", { goal })}</span>
          <button onClick={() => change(1)} className="rounded border border-line p-0.5 hover:text-ink" aria-label={t("goal.more")}><Plus size={12} /></button>
        </div>
      </div>
    </div>
  );
};
