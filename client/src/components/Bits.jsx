import { useEffect, useState } from "react";
import { STATUS_STYLE } from "../lib/status";
import { useI18n } from "../i18n";

export const StatusBadge = ({ status }) => {
  const { t } = useI18n();
  const style = STATUS_STYLE[status] || STATUS_STYLE.Saved;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${style.soft} ${style.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {t(`status.${status}`)}
    </span>
  );
};

export const PageHeader = ({ eyebrow, title, children }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div>
      {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
    </div>
    {children}
  </div>
);

export const Spinner = () => (
  <div className="grid place-items-center py-24">
    <div className="h-7 w-7 animate-spin rounded-full border-2 border-line border-t-accent" />
  </div>
);

// The API sleeps on its free host. When a request takes longer than a moment,
// this explains the wait instead of leaving the visitor with a frozen button.
const WakeNotice = () => {
  const { t } = useI18n();
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const tick = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(tick);
  }, []);

  // Stay invisible for fast requests.
  if (seconds < 2) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-bg/80 p-6 backdrop-blur-sm">
      <div className="card rise max-w-sm p-7 text-center">
        <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-2 border-line border-t-accent" />
        <h2 className="font-display text-xl font-semibold">{t("wake.title")}</h2>
        <p className="mt-2 text-sm text-muted">{t("wake.text")}</p>
        <p className="mt-4 text-xs tabular-nums text-muted">{t("wake.elapsed", { seconds })}</p>
      </div>
    </div>
  );
};

export const WakeOverlay = ({ active }) => (active ? <WakeNotice /> : null);
