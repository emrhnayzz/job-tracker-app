import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, ClipboardPaste, FileUp } from "lucide-react";
import { api, errorCode } from "../lib/api";
import { useApplications } from "../context/ApplicationsContext";
import { useI18n } from "../i18n";
import { STATUSES, WORK_TYPES, toDateInput, toDateTimeInput } from "../lib/status";
import { Spinner } from "../components/Bits";
import { Interest } from "../components/Extras";

const EMPTY = {
  company: "", position: "", status: "Applied", applied_date: toDateInput(new Date()),
  work_type: "", location: "", salary_min: "", salary_max: "", currency: "EUR", link: "",
  description: "", recruiter_name: "", recruiter_email: "", notes: "", interview_date: "", follow_up_date: "", interest: "",
};

const Section = ({ title, children }) => (
  <section className="card p-6">
    <h2 className="eyebrow mb-5">{title}</h2>
    <div className="grid gap-4 sm:grid-cols-2">{children}</div>
  </section>
);

// Paste a posting and let the server fill in what it can find.
const PastePosting = ({ onFilled }) => {
  const { t } = useI18n();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const analyse = async () => {
    setBusy(true);
    try {
      const { data } = await api.post("/ai/parse-posting", { text });
      const found = Object.values(data.fields).filter((value) => value !== null && value !== undefined).length;
      onFilled(data.fields, text);
      toast.success(t("paste.done", { count: found }));
      setText("");
    } catch (err) {
      toast.error(t(`error.${errorCode(err)}`));
    }
    setBusy(false);
  };

  return (
    <section className="card border-dashed p-6">
      <h2 className="eyebrow mb-1.5 flex items-center gap-2"><ClipboardPaste size={14} /> {t("paste.title")}</h2>
      <p className="mb-3 text-sm text-muted">{t("paste.lead")}</p>
      <textarea value={text} onChange={(event) => setText(event.target.value)} rows={4} placeholder={t("paste.placeholder")} className="input resize-y" />
      <div className="mt-3 flex justify-end">
        <button type="button" onClick={analyse} disabled={busy || text.trim().length < 30} className="btn-ghost">
          {busy ? t("paste.working") : t("paste.action")}
        </button>
      </div>
    </section>
  );
};

export default function ApplicationForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { create, update } = useApplications();
  const { t } = useI18n();
  const [form, setForm] = useState(EMPTY);
  const [cvFile, setCvFile] = useState(null);
  const [existingCv, setExistingCv] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    api
      .get(`/applications/${id}`)
      .then(({ data }) => {
        const next = { ...EMPTY };
        for (const key of Object.keys(EMPTY)) next[key] = data[key] ?? "";
        next.applied_date = toDateInput(data.applied_date);
        next.follow_up_date = toDateInput(data.follow_up_date);
        next.interview_date = toDateTimeInput(data.interview_date);
        setForm(next);
        setExistingCv(data.cv_name);
        setLoading(false);
      })
      .catch(() => navigate("/app", { replace: true }));
  }, [id, isEdit, navigate]);

  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  // Values from a pasted posting only fill fields that are still empty.
  const fillFromPosting = (fields, postingText) =>
    setForm((current) => {
      const next = { ...current, description: current.description || postingText };
      for (const [key, value] of Object.entries(fields)) {
        if (value !== null && value !== undefined && !current[key]) next[key] = String(value);
      }
      return next;
    });

  // A plain text field wired to the form state.
  const field = (name, props = {}) => (
    <div className={props.wide ? "sm:col-span-2" : ""}>
      <label className="label" htmlFor={name}>
        {t(`field.${name}`)} {props.required && <span className="text-rejected">*</span>}
      </label>
      {props.as === "textarea" ? (
        <textarea id={name} name={name} value={form[name]} onChange={change} rows={props.rows || 4} placeholder={props.placeholder} className="input resize-y" />
      ) : (
        <input id={name} name={name} type={props.type || "text"} value={form[name]} onChange={change} required={props.required} placeholder={props.placeholder} min={props.min} className="input" />
      )}
    </div>
  );

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const saved = isEdit ? await update(id, form, cvFile) : await create(form, cvFile);
      toast.success(t(isEdit ? "toast.saved" : "toast.created"));
      navigate(`/app/a/${saved.id}`);
    } catch (err) {
      toast.error(t(`error.${errorCode(err)}`));
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl">
      <Link to={isEdit ? `/app/a/${id}` : "/app"} className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft size={16} /> {t("action.back")}
      </Link>
      <h1 className="mb-6 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        {t(isEdit ? "form.editTitle" : "form.newTitle")}
      </h1>

      <div className="space-y-5">
        {!isEdit && <PastePosting onFilled={fillFromPosting} />}
        <Section title={t("form.sectionJob")}>
          {field("company", { required: true })}
          {field("position", { required: true })}
          <div>
            <label className="label" htmlFor="status">{t("field.status")}</label>
            <select id="status" name="status" value={form.status} onChange={change} className="input">
              {STATUSES.map((status) => (
                <option key={status} value={status}>{t(`status.${status}`)}</option>
              ))}
            </select>
          </div>
          {field("applied_date", { type: "date" })}
          {field("location", { placeholder: "Jena" })}
          <div>
            <label className="label" htmlFor="work_type">{t("field.work_type")}</label>
            <select id="work_type" name="work_type" value={form.work_type} onChange={change} className="input">
              <option value="">–</option>
              {WORK_TYPES.map((type) => (
                <option key={type} value={type}>{t(`workType.${type}`)}</option>
              ))}
            </select>
          </div>
          <div>
            <span className="label">{t("field.interest")}</span>
            <div className="flex h-[42px] items-center">
              <Interest value={Number(form.interest) || null} onChange={(value) => setForm({ ...form, interest: value ?? "" })} size={22} />
            </div>
          </div>
          {field("link", { type: "url", placeholder: "https://" })}
          {field("description", { as: "textarea", wide: true, rows: 5, placeholder: t("form.descriptionHint") })}
        </Section>

        <Section title={t("form.sectionPay")}>
          {field("salary_min", { type: "number", min: 0 })}
          {field("salary_max", { type: "number", min: 0 })}
        </Section>

        <Section title={t("form.sectionNext")}>
          {field("interview_date", { type: "datetime-local" })}
          {field("follow_up_date", { type: "date" })}
          {field("recruiter_name")}
          {field("recruiter_email", { type: "email" })}
          {field("notes", { as: "textarea", wide: true })}
          <div className="sm:col-span-2">
            <span className="label">{t("field.cv")}</span>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-line px-4 py-3.5 text-sm text-muted hover:border-accent hover:text-ink">
              <FileUp size={18} />
              <span className="truncate">{cvFile?.name || existingCv || t("form.cvHint")}</span>
              <input type="file" accept="application/pdf" className="hidden" onChange={(event) => setCvFile(event.target.files[0] || null)} />
            </label>
          </div>
        </Section>
      </div>

      <div className="sticky bottom-0 -mx-4 mt-6 flex justify-end gap-3 border-t border-line bg-bg/90 px-4 py-4 backdrop-blur sm:mx-0 sm:px-0">
        <Link to={isEdit ? `/app/a/${id}` : "/app"} className="btn-ghost">{t("action.cancel")}</Link>
        <button type="submit" disabled={saving} className="btn-primary">{t(isEdit ? "action.save" : "action.create")}</button>
      </div>
    </form>
  );
}
