import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useApplications } from "../context/ApplicationsContext";
import { useTheme } from "../context/ThemeContext";
import { useI18n } from "../i18n";
import { STATUS_STYLE, computeStats } from "../lib/status";
import { PageHeader, Spinner } from "../components/Bits";
import FlowChart from "../components/FlowChart";

const WEEKS = 8;

// SVG attributes cannot read CSS variables, so the chart gets its colours
// from here. The values mirror the tokens in index.css.
const CHART_COLORS = {
  light: { accent: "#1a7a4f", muted: "#686e68", line: "#e1dcd0", surface: "#ffffff", ink: "#171a18", sunken: "#eeeae0" },
  dark: { accent: "#56d091", muted: "#929e96", line: "#28342e", surface: "#161d1a", ink: "#ebf0ec", sunken: "#111714" },
};
const mondayOf = (value) => {
  const day = new Date(value);
  day.setHours(0, 0, 0, 0);
  day.setDate(day.getDate() - ((day.getDay() + 6) % 7));
  return day;
};

// How many applications reached each stage. An application counts for every
// stage it has passed, so the bars can only shrink from left to right.
const Funnel = ({ stats }) => {
  const { t } = useI18n();
  const steps = [
    ["Applied", stats.sent],
    ["Interview", stats.interviews + stats.offers],
    ["Offer", stats.offers],
  ];
  const max = Math.max(stats.sent, 1);
  return (
    <section className="card p-6">
      <h2 className="eyebrow mb-5">{t("insights.funnel")}</h2>
      <div className="space-y-4">
        {steps.map(([status, value]) => (
          <div key={status}>
            <div className="mb-1.5 flex items-baseline justify-between text-sm">
              <span className="font-medium">{t(`status.${status}`)}</span>
              <span className="tabular-nums text-muted">
                {value} · {Math.round((value / max) * 100)} %
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-sunken">
              <div className={`h-full rounded-full ${STATUS_STYLE[status].bar}`} style={{ width: `${Math.max((value / max) * 100, value ? 3 : 0)}%` }} />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-5 text-xs text-muted">{t("insights.funnelNote")}</p>
    </section>
  );
};

export default function Insights() {
  const { applications, loading } = useApplications();
  const { t, formatDate } = useI18n();
  const { theme } = useTheme();
  const colors = CHART_COLORS[theme] || CHART_COLORS.light;

  const stats = useMemo(() => computeStats(applications), [applications]);
  const weekly = useMemo(() => {
    const start = mondayOf(new Date());
    start.setDate(start.getDate() - (WEEKS - 1) * 7);
    const buckets = Array.from({ length: WEEKS }, (_, index) => {
      const week = new Date(start);
      week.setDate(week.getDate() + index * 7);
      return { week, label: formatDate(week, { day: "numeric", month: "short" }), count: 0 };
    });
    for (const app of applications) {
      if (!app.applied_date || app.status === "Saved") continue;
      const index = Math.round((mondayOf(app.applied_date) - start) / (7 * 24 * 60 * 60 * 1000));
      if (index >= 0 && index < WEEKS) buckets[index].count += 1;
    }
    return buckets;
  }, [applications, formatDate]);

  if (loading) return <Spinner />;

  const tiles = [
    [t("stat.sent"), stats.sent],
    [t("stat.responseRate"), stats.responseRate === null ? "–" : `${stats.responseRate} %`],
    [t("stat.interviewRate"), stats.sent ? `${Math.round(((stats.interviews + stats.offers) / stats.sent) * 100)} %` : "–"],
    [t("stat.saved"), stats.saved],
  ];

  return (
    <>
      <PageHeader eyebrow={t("insights.eyebrow")} title={t("insights.title")} />

      <section className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map(([label, value]) => (
          <div key={label} className="card p-5">
            <p className="eyebrow">{label}</p>
            <p className="mt-2 font-display text-4xl font-semibold tabular-nums tracking-tight">{value}</p>
          </div>
        ))}
      </section>

      <section className="card mb-5 p-6">
        <h2 className="eyebrow mb-1.5">{t("flow.title")}</h2>
        <p className="mb-5 text-sm text-muted">{t("flow.lead")}</p>
        <FlowChart applications={applications} />
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <Funnel stats={stats} />

        <section className="card p-6">
          <h2 className="eyebrow mb-5">{t("insights.weekly", { weeks: WEEKS })}</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekly} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={colors.line} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: colors.muted, fontSize: 11 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: colors.muted, fontSize: 11 }} />
                <Tooltip
                  cursor={{ fill: colors.sunken }}
                  formatter={(value) => [value, t("insights.applications")]}
                  contentStyle={{
                    background: colors.surface,
                    border: `1px solid ${colors.line}`,
                    borderRadius: 12,
                    fontSize: 13,
                    color: colors.ink,
                  }}
                />
                <Bar dataKey="count" fill={colors.accent} radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card p-6 lg:col-span-2">
          <h2 className="eyebrow mb-5">{t("insights.byStatus")}</h2>
          <div className="flex h-4 overflow-hidden rounded-full bg-sunken">
            {Object.keys(STATUS_STYLE).map((status) => {
              const count = applications.filter((app) => app.status === status).length;
              return count ? (
                <div key={status} className={STATUS_STYLE[status].bar} style={{ width: `${(count / applications.length) * 100}%` }} title={`${t(`status.${status}`)}: ${count}`} />
              ) : null;
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {Object.keys(STATUS_STYLE).map((status) => (
              <span key={status} className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${STATUS_STYLE[status].dot}`} />
                {t(`status.${status}`)}
                <span className="tabular-nums text-muted">{applications.filter((app) => app.status === status).length}</span>
              </span>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
