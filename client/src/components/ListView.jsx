import { useNavigate } from "react-router-dom";
import { useI18n } from "../i18n";
import { useAuth } from "../context/AuthContext";
import { matchSkills } from "../lib/skills";
import { formatSalary } from "../lib/status";
import { StatusBadge } from "./Bits";
import { Interest } from "./Extras";

export default function ListView({ applications }) {
  const { t, formatDate } = useI18n();
  const navigate = useNavigate();
  const { user } = useAuth();
  const rows = [...applications].sort(
    (a, b) => new Date(b.applied_date || b.created_at) - new Date(a.applied_date || a.created_at)
  );

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
            <th className="px-5 py-3 font-semibold">{t("field.company")}</th>
            <th className="px-3 py-3 font-semibold">{t("field.status")}</th>
            <th className="px-3 py-3 font-semibold">{t("field.applied_date")}</th>
            <th className="px-3 py-3 font-semibold">{t("field.location")}</th>
            <th className="px-3 py-3 font-semibold">{t("match.title")}</th>
            <th className="px-5 py-3 text-right font-semibold">{t("field.salary")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((app) => (
            <tr
              key={app.id}
              onClick={() => navigate(`/app/a/${app.id}`)}
              className="cursor-pointer border-b border-line/70 last:border-0 hover:bg-sunken/60"
            >
              <td className="px-5 py-3.5">
                <p className="flex items-center gap-2 font-semibold">
                  {app.company} <Interest value={app.interest} size={12} />
                </p>
                <p className="text-muted">{app.position}</p>
              </td>
              <td className="px-3 py-3.5">
                <StatusBadge status={app.status} />
              </td>
              <td className="px-3 py-3.5 text-muted">{app.applied_date ? formatDate(app.applied_date) : "–"}</td>
              <td className="px-3 py-3.5 text-muted">
                {[app.location, app.work_type && t(`workType.${app.work_type}`)].filter(Boolean).join(" · ") || "–"}
              </td>
              <td className="px-3 py-3.5 tabular-nums text-muted">{matchSkills(app, user) ? `${matchSkills(app, user).score} %` : "–"}</td>
              <td className="px-5 py-3.5 text-right tabular-nums text-muted">{formatSalary(app) || "–"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
