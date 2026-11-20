export const STATUSES = ["Saved", "Applied", "Interview", "Offer", "Rejected"];
export const WORK_TYPES = ["Remote", "Hybrid", "On-site"];

// Tailwind needs complete class names in the source, so they are spelled out.
export const STATUS_STYLE = {
  Saved: { dot: "bg-saved", text: "text-saved", soft: "bg-saved/10", bar: "bg-saved" },
  Applied: { dot: "bg-applied", text: "text-applied", soft: "bg-applied/10", bar: "bg-applied" },
  Interview: { dot: "bg-interview", text: "text-interview", soft: "bg-interview/10", bar: "bg-interview" },
  Offer: { dot: "bg-offer", text: "text-offer", soft: "bg-offer/10", bar: "bg-offer" },
  Rejected: { dot: "bg-rejected", text: "text-rejected", soft: "bg-rejected/10", bar: "bg-rejected" },
};

const DAY = 24 * 60 * 60 * 1000;
const startOfDay = (value) => {
  const day = new Date(value);
  day.setHours(0, 0, 0, 0);
  return day;
};

// Whole days from today to the given date: negative means in the past.
export const daysUntil = (value) =>
  value ? Math.round((startOfDay(value) - startOfDay(new Date())) / DAY) : null;

export const daysSince = (value) => (value ? -daysUntil(value) : null);

// An application needs attention when a follow-up is due, or when it has been
// waiting for an answer for two weeks without a follow-up planned.
export const STALE_AFTER_DAYS = 14;
export const needsFollowUp = (app) => {
  if (app.status !== "Applied") return false;
  if (app.follow_up_date) return daysUntil(app.follow_up_date) <= 0;
  const waiting = daysSince(app.last_activity_at || app.applied_date);
  return waiting !== null && waiting >= STALE_AFTER_DAYS;
};

export const toDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const toDateTimeInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  const pad = (n) => String(n).padStart(2, "0");
  return `${toDateInput(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const formatSalary = (app) => {
  if (!app.salary_min && !app.salary_max) return "";
  const range = [...new Set([app.salary_min, app.salary_max].filter(Boolean))].join("–");
  return `${range} ${app.currency || "EUR"}`;
};

export const computeStats = (applications) => {
  const count = (status) => applications.filter((app) => app.status === status).length;
  const sent = applications.filter((app) => app.status !== "Saved").length;
  const answered = count("Interview") + count("Offer") + count("Rejected");
  return {
    saved: count("Saved"),
    sent,
    active: count("Applied") + count("Interview"),
    interviews: count("Interview"),
    offers: count("Offer"),
    rejected: count("Rejected"),
    answered,
    responseRate: sent ? Math.round((answered / sent) * 100) : null,
  };
};

// Applications sent since Monday of the current week.
export const sentThisWeek = (applications) => {
  const monday = startOfDay(new Date());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return applications.filter(
    (app) => app.status !== "Saved" && app.applied_date && startOfDay(app.applied_date) >= monday
  ).length;
};
