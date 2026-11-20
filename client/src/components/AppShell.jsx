import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { BarChart3, Inbox, KanbanSquare, LogOut, Plus, UserRound } from "lucide-react";
import { useApplications } from "../context/ApplicationsContext";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../i18n";
import { fileUrl } from "../lib/api";
import { LanguageSwitch, Logo, ThemeToggle } from "./Brand";

export const Avatar = ({ user, size = "h-8 w-8 text-sm" }) =>
  user.avatar_path ? (
    <img src={fileUrl(user.avatar_path)} alt="" className={`${size} rounded-full object-cover`} />
  ) : (
    <span className={`${size} grid place-items-center rounded-full bg-accent/15 font-semibold uppercase text-accent`}>
      {user.is_demo ? "D" : user.username.slice(0, 1)}
    </span>
  );

const UserMenu = () => {
  const { user, signOut } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (event) => !ref.current?.contains(event.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="rounded-full ring-accent/40 focus:outline-none focus-visible:ring-2" aria-label={t("nav.account")}>
        <Avatar user={user} />
      </button>
      {open && (
        <div className="rise absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-xl border border-line bg-surface p-1 shadow-lift">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-semibold">{user.is_demo ? t("demo.user") : user.username}</p>
            {!user.is_demo && <p className="truncate text-xs text-muted">{user.email}</p>}
          </div>
          <Link to="/app/profile" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-sunken">
            <UserRound size={16} /> {t("nav.profile")}
          </Link>
          <button
            onClick={() => {
              signOut();
              navigate("/");
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rejected hover:bg-rejected/10"
          >
            <LogOut size={16} /> {t("nav.logout")}
          </button>
        </div>
      )}
    </div>
  );
};

const navClass = ({ isActive }) =>
  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? "bg-sunken text-ink" : "text-muted hover:text-ink"
  }`;

export default function AppShell({ children }) {
  const { user, signOut } = useAuth();
  const { pendingMails } = useApplications();
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {user.is_demo && (
        <div className="bg-ink px-4 py-1.5 text-center text-xs text-bg">
          {t("demo.banner")}{" "}
          <button
            onClick={() => {
              signOut();
              navigate("/register");
            }}
            className="font-semibold underline underline-offset-2"
          >
            {t("demo.bannerAction")}
          </button>
        </div>
      )}

      <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-2 px-4 sm:gap-4 sm:px-6">
          <Logo to="/app" />
          <nav className="ml-2 flex items-center gap-1 sm:ml-6">
            <NavLink to="/app" end className={navClass}>
              <KanbanSquare size={17} /> <span className="hidden md:inline">{t("nav.board")}</span>
            </NavLink>
            <NavLink to="/app/inbox" className={navClass}>
              <span className="relative">
                <Inbox size={17} />
                {pendingMails > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold leading-none text-accent-ink">
                    {pendingMails}
                  </span>
                )}
              </span>
              <span className="hidden md:inline">{t("nav.inbox")}</span>
            </NavLink>
            <NavLink to="/app/insights" className={navClass}>
              <BarChart3 size={17} /> <span className="hidden md:inline">{t("nav.insights")}</span>
            </NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
            <Link to="/app/new" className="btn-primary !px-3 md:!px-4" aria-label={t("nav.new")}>
              <Plus size={17} /> <span className="hidden md:inline">{t("nav.new")}</span>
            </Link>
            <div className="hidden sm:block">
              <LanguageSwitch />
            </div>
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
