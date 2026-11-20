import { Moon, Sun } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useI18n } from "../i18n";
import { APP_NAME } from "../lib/config";


export const Logo = ({ to = "/" }) => (
  <Link to={to} className="group flex items-center gap-2.5">
    <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-accent text-accent-ink transition group-hover:-rotate-6">
      <svg viewBox="0 0 24 24" className="h-4.5 w-[18px]" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
    </span>
    <span className="font-display text-xl font-semibold tracking-tight">{APP_NAME}</span>
  </Link>
);

export const LanguageSwitch = () => {
  const { lang, setLang } = useI18n();
  return (
    <div className="flex rounded-lg border border-line p-0.5 text-xs font-semibold" role="group" aria-label="Language">
      {["de", "en"].map((code) => (
        <button
          key={code}
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          className={`rounded-md px-2 py-1 uppercase transition ${
            lang === code ? "bg-ink text-bg" : "text-muted hover:text-ink"
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  );
};

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();
  return (
    <button onClick={toggleTheme} className="btn-quiet !px-2.5" aria-label={t("theme.toggle")} title={t("theme.toggle")}>
      {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
};
