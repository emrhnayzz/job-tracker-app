import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowRight, BarChart3, Github, KanbanSquare, MailCheck, ShieldCheck, Target } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../i18n";
import { wakeServer } from "../lib/api";
import { STATUS_STYLE } from "../lib/status";
import { LanguageSwitch, Logo, ThemeToggle } from "../components/Brand";
import { APP_NAME, AUTHOR_URL, REPO_URL } from "../lib/config";
import { WakeOverlay } from "../components/Bits";

const MiniCard = ({ company, role, className = "" }) => (
  <div className={`rounded-lg border border-line bg-surface p-2.5 shadow-card ${className}`}>
    <p className="text-[11px] font-semibold leading-tight">{company}</p>
    <p className="mt-0.5 text-[10px] leading-tight text-muted">{role}</p>
  </div>
);

// A small board for the hero: one card keeps travelling from "Applied" to "Offer".
const BoardPreview = () => {
  const { t } = useI18n();
  const columns = [
    ["Applied", [["Fuchsbau Studios", "Frontend (React)"], ["Blaupause Cloud", "Backend (Node.js)"]]],
    ["Interview", [["Saalewerk Digital", "Mobile Development"]]],
    ["Offer", []],
  ];
  return (
    <div className="card relative rotate-1 p-4 sm:p-5" aria-hidden="true">
      <div className="mb-4 flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-rejected/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-interview/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-offer/70" />
      </div>
      <div className="relative grid grid-cols-3 gap-3">
        {columns.map(([status, cards]) => (
          <div key={status}>
            <div className="mb-2 flex items-center gap-1.5 px-1">
              <span className={`h-1.5 w-1.5 rounded-full ${STATUS_STYLE[status].dot}`} />
              <span className="text-[11px] font-semibold">{t(`status.${status}`)}</span>
            </div>
            <div className="min-h-[190px] space-y-2 rounded-xl bg-sunken/70 p-2 pt-[62px]">
              {cards.map(([company, role]) => (
                <MiniCard key={company} company={company} role={role} />
              ))}
            </div>
          </div>
        ))}
        <div className="travel absolute left-2 top-[34px] w-[calc((100%-1.5rem)/3-1rem)]">
          <MiniCard company="Nordlicht Software" role="Softwareentwicklung" className="!border-accent ring-2 ring-accent/20" />
        </div>
      </div>
    </div>
  );
};

const FEATURES = [
  ["board", KanbanSquare],
  ["inbox", MailCheck],
  ["match", Target],
  ["insights", BarChart3],
];

export default function Landing() {
  const { startDemo } = useAuth();
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const wantsDemo = params.get("demo") === "1";
  const [starting, setStarting] = useState(wantsDemo);
  const autoStarted = useRef(false);

  const runDemo = useCallback(
    () =>
      startDemo(lang)
        .then(() => navigate("/app"))
        .catch(() => {
          toast.error(t("error.demo"));
          setStarting(false);
        }),
    [startDemo, lang, navigate, t]
  );

  const openDemo = () => {
    setStarting(true);
    runDemo();
  };

  // Wake the sleeping API as soon as someone opens the page. A link with
  // ?demo=1 goes straight into the demo, which is handy for sharing.
  useEffect(() => {
    if (wantsDemo && !autoStarted.current) {
      autoStarted.current = true;
      runDemo();
    } else if (!wantsDemo) {
      wakeServer();
    }
  }, [wantsDemo, runDemo]);

  return (
    <div className="min-h-screen overflow-x-hidden">
      <WakeOverlay active={starting} />

      <header className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Logo />
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitch />
          <ThemeToggle />
          <Link to="/login" className="btn-ghost hidden sm:inline-flex">
            {t("auth.login")}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 sm:px-8">
        <section className="grid items-center gap-12 pb-20 pt-10 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
          <div className="rise">
            <p className="eyebrow mb-5 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" /> {t("landing.eyebrow")}
            </p>
            <h1 className="font-display text-5xl font-semibold leading-[1.04] tracking-tight [text-wrap:balance] sm:text-6xl">
              {t("landing.title1")}
              <br />
              <span className="italic text-accent">{t("landing.title2")}</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">{t("landing.lead")}</p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <button onClick={openDemo} disabled={starting} className="btn-primary !px-6 !py-3.5 !text-base">
                {t("landing.demo")} <ArrowRight size={18} />
              </button>
              <Link to="/register" className="btn-ghost !px-6 !py-3.5 !text-base">
                {t("auth.register")}
              </Link>
            </div>
            <p className="mt-4 flex items-center gap-2 text-sm text-muted">
              <ShieldCheck size={16} className="text-accent" /> {t("landing.demoHint")}
            </p>
          </div>
          <div className="rise [animation-delay:120ms]">
            <BoardPreview />
          </div>
        </section>

        <section className="grid gap-4 pb-20 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(([key, Icon]) => (
            <article key={key} className="card p-6">
              <span className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-accent/10 text-accent">
                <Icon size={20} />
              </span>
              <h2 className="font-display text-xl font-semibold">{t(`feature.${key}.title`)}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{t(`feature.${key}.text`)}</p>
            </article>
          ))}
        </section>

        <section className="card mb-20 grid gap-8 p-8 sm:p-10 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="eyebrow mb-3">{t("landing.techEyebrow")}</p>
            <h2 className="font-display text-3xl font-semibold tracking-tight">{t("landing.techTitle")}</h2>
            <a href={REPO_URL} target="_blank" rel="noreferrer" className="btn-ghost mt-6">
              <Github size={17} /> {t("landing.source")}
            </a>
          </div>
          <dl className="grid gap-x-8 gap-y-5 text-sm sm:grid-cols-2">
            {["frontend", "backend", "security", "tests"].map((key) => (
              <div key={key}>
                <dt className="font-semibold">{t(`tech.${key}.title`)}</dt>
                <dd className="mt-1 leading-relaxed text-muted">{t(`tech.${key}.text`)}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-sm text-muted sm:px-8">
          <span>
            {APP_NAME} · {t("landing.builtBy")}{" "}
            <a href={AUTHOR_URL} target="_blank" rel="noreferrer" className="font-medium text-ink underline underline-offset-2">
              Emirhan Ayaz
            </a>
          </span>
          <Link to="/login" className="font-medium text-ink sm:hidden">
            {t("auth.login")}
          </Link>
        </div>
      </footer>
    </div>
  );
}
