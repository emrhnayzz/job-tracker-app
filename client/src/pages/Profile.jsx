import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Camera } from "lucide-react";
import { api, errorCode } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../i18n";
import { Avatar } from "../components/AppShell";
import { LanguageSwitch } from "../components/Brand";
import { PageHeader } from "../components/Bits";

export default function Profile() {
  const { user, setUser, signOut } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: user.username, email: user.email, bio: user.bio || "", skills: user.skills || "" });
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "" });
  const [saving, setSaving] = useState(false);

  const save = async (payload, successKey = "toast.saved") => {
    setSaving(true);
    try {
      const body = new FormData();
      for (const [key, value] of Object.entries(payload)) body.append(key, value);
      const { data } = await api.put("/me", body);
      setUser(data);
      toast.success(t(successKey));
      return true;
    } catch (err) {
      toast.error(t(`error.${errorCode(err)}`));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    if (await save(passwords, "toast.passwordChanged")) setPasswords({ currentPassword: "", newPassword: "" });
  };

  const deleteAccount = async () => {
    if (!window.confirm(t("confirm.deleteAccount"))) return;
    await api.delete("/me");
    signOut();
    navigate("/");
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader eyebrow={t("profile.eyebrow")} title={t("profile.title")} />

      <div className="space-y-5">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            save(form);
          }}
          className="card space-y-5 p-6"
        >
          <div className="flex items-center gap-4">
            <Avatar user={user} size="h-16 w-16 text-2xl" />
            <label className="btn-ghost cursor-pointer">
              <Camera size={16} /> {t("profile.changePhoto")}
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => event.target.files[0] && save({ avatar: event.target.files[0] })} />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="username">{t("field.username")}</label>
              <input id="username" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} className="input" required minLength={2} />
            </div>
            <div>
              <label className="label" htmlFor="email">{t("field.email")}</label>
              <input id="email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="input" disabled={user.is_demo} required />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="bio">{t("profile.bio")}</label>
            <textarea id="bio" rows={4} value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} className="input resize-y" maxLength={2000} />
            <p className="mt-1.5 text-xs text-muted">{t("profile.bioHint")}</p>
          </div>
          <div>
            <label className="label" htmlFor="skills">{t("profile.skills")}</label>
            <input id="skills" value={form.skills} onChange={(event) => setForm({ ...form, skills: event.target.value })} className="input" maxLength={1000} placeholder="React, TypeScript, SQL" />
            <p className="mt-1.5 text-xs text-muted">{t("profile.skillsHint")}</p>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="btn-primary">{t("action.save")}</button>
          </div>
        </form>

        <section className="card flex items-center justify-between gap-4 p-6">
          <div>
            <h2 className="font-semibold">{t("profile.language")}</h2>
            <p className="text-sm text-muted">{t("profile.languageHint")}</p>
          </div>
          <LanguageSwitch />
        </section>

        <section className="card space-y-4 p-6">
          <div>
            <h2 className="font-semibold">{t("auto.title")}</h2>
            <p className="text-sm text-muted">{t("auto.lead")}</p>
          </div>
          {[
            ["auto_tasks", "auto.tasks", "auto.tasksHint"],
            ["auto_apply", "auto.apply", "auto.applyHint"],
          ].map(([field, label, hint]) => (
            <label key={field} className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-line p-4">
              <span>
                <span className="block text-sm font-medium">{t(label)}</span>
                <span className="block text-sm text-muted">{t(hint)}</span>
              </span>
              <input
                type="checkbox"
                checked={Boolean(user[field])}
                onChange={(event) => save({ [field]: event.target.checked })}
                className="mt-1 h-5 w-5 shrink-0 accent-[rgb(var(--accent))]"
              />
            </label>
          ))}
          {user.inbox_address && (
            <div>
              <span className="label">{t("auto.address")}</span>
              <p className="rounded-xl border border-line bg-sunken/60 px-3.5 py-2.5 font-mono text-xs">{user.inbox_address}</p>
            </div>
          )}
        </section>

        {!user.is_demo && (
          <form onSubmit={changePassword} className="card space-y-4 p-6">
            <h2 className="font-semibold">{t("profile.password")}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="currentPassword">{t("profile.currentPassword")}</label>
                <input id="currentPassword" type="password" value={passwords.currentPassword} onChange={(event) => setPasswords({ ...passwords, currentPassword: event.target.value })} className="input" required autoComplete="current-password" />
              </div>
              <div>
                <label className="label" htmlFor="newPassword">{t("profile.newPassword")}</label>
                <input id="newPassword" type="password" value={passwords.newPassword} onChange={(event) => setPasswords({ ...passwords, newPassword: event.target.value })} className="input" required minLength={8} autoComplete="new-password" />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={saving} className="btn-ghost">{t("profile.changePassword")}</button>
            </div>
          </form>
        )}

        <section className="card flex flex-wrap items-center justify-between gap-4 border-rejected/30 p-6">
          <div>
            <h2 className="font-semibold">{t("profile.delete")}</h2>
            <p className="max-w-sm text-sm text-muted">{t("profile.deleteHint")}</p>
          </div>
          <button onClick={deleteAccount} className="btn-danger">{t("profile.delete")}</button>
        </section>
      </div>
    </div>
  );
}
