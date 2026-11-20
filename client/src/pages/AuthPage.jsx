import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../i18n";
import { errorCode } from "../lib/api";
import { LanguageSwitch, Logo, ThemeToggle } from "../components/Brand";
import { WakeOverlay } from "../components/Bits";

export default function AuthPage({ mode }) {
  const isRegister = mode === "register";
  const { login, register, startDemo } = useAuth();
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const run = async (action) => {
    setBusy(true);
    setError("");
    try {
      await action();
      navigate("/app");
    } catch (err) {
      setError(t(`error.${errorCode(err)}`));
      setBusy(false);
    }
  };

  const submit = (event) => {
    event.preventDefault();
    run(() => (isRegister ? register(form) : login({ email: form.email, password: form.password })));
  };

  return (
    <div className="flex min-h-screen flex-col">
      <WakeOverlay active={busy} />
      <header className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <Logo />
        <div className="flex items-center gap-2">
          <LanguageSwitch />
          <ThemeToggle />
        </div>
      </header>

      <main className="grid flex-1 place-items-center px-5 pb-16">
        <div className="card rise w-full max-w-md p-8">
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {t(isRegister ? "auth.registerTitle" : "auth.loginTitle")}
          </h1>
          <p className="mt-2 text-sm text-muted">{t(isRegister ? "auth.registerLead" : "auth.loginLead")}</p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            {isRegister && (
              <div>
                <label className="label" htmlFor="username">{t("field.username")}</label>
                <input id="username" name="username" value={form.username} onChange={change} className="input" required minLength={2} maxLength={50} autoComplete="username" />
              </div>
            )}
            <div>
              <label className="label" htmlFor="email">{t("field.email")}</label>
              <input id="email" name="email" type="email" value={form.email} onChange={change} className="input" required autoComplete="email" />
            </div>
            <div>
              <label className="label" htmlFor="password">{t("field.password")}</label>
              <input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={change}
                className="input"
                required
                minLength={isRegister ? 8 : undefined}
                autoComplete={isRegister ? "new-password" : "current-password"}
              />
              {isRegister && <p className="mt-1.5 text-xs text-muted">{t("auth.passwordHint")}</p>}
            </div>

            {error && (
              <p role="alert" className="rounded-xl bg-rejected/10 px-3.5 py-2.5 text-sm text-rejected">
                {error}
              </p>
            )}

            <button type="submit" disabled={busy} className="btn-primary w-full !py-3">
              {t(isRegister ? "auth.register" : "auth.login")}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-line" /> {t("auth.or")} <span className="h-px flex-1 bg-line" />
          </div>
          <button onClick={() => run(() => startDemo(lang))} disabled={busy} className="btn-ghost w-full !py-3">
            {t("landing.demo")}
          </button>

          <p className="mt-6 text-center text-sm text-muted">
            {t(isRegister ? "auth.haveAccount" : "auth.noAccount")}{" "}
            <Link to={isRegister ? "/login" : "/register"} className="font-semibold text-accent">
              {t(isRegister ? "auth.login" : "auth.register")}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
