const STATUSES = ["Saved", "Applied", "Interview", "Offer", "Rejected"];
const WORK_TYPES = ["Remote", "Hybrid", "On-site"];

const text = (value, max) => {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  if (!trimmed || trimmed === "null") return null;
  return trimmed.slice(0, max);
};

const int = (value) => {
  const cleaned = text(value, 12);
  if (cleaned === null) return null;
  const parsed = Number.parseInt(cleaned, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

const date = (value) => {
  const cleaned = text(value, 40);
  if (cleaned === null) return null;
  const parsed = new Date(cleaned);
  return Number.isNaN(parsed.getTime()) ? null : cleaned;
};

const link = (value) => {
  const cleaned = text(value, 2000);
  if (cleaned === null) return null;
  return /^https?:\/\//i.test(cleaned) ? cleaned : null;
};

// Turns a request body into clean column values. Returns { values } or { error }.
const parseApplication = (body = {}) => {
  const company = text(body.company, 255);
  const position = text(body.position, 255);
  if (!company || !position) return { error: "company_and_position_required" };

  const status = text(body.status, 50) || "Applied";
  if (!STATUSES.includes(status)) return { error: "invalid_status" };

  const workType = text(body.work_type, 50);
  const interest = int(body.interest);

  return {
    values: {
      company,
      position,
      status,
      applied_date: date(body.applied_date),
      work_type: WORK_TYPES.includes(workType) ? workType : null,
      location: text(body.location, 100),
      salary_min: int(body.salary_min),
      salary_max: int(body.salary_max),
      currency: text(body.currency, 10) || "EUR",
      link: link(body.link),
      description: text(body.description, 20000),
      recruiter_name: text(body.recruiter_name, 100),
      recruiter_email: text(body.recruiter_email, 100),
      notes: text(body.notes, 20000),
      interview_date: date(body.interview_date),
      follow_up_date: date(body.follow_up_date),
      interest: interest >= 1 && interest <= 3 ? interest : null,
    },
  };
};

module.exports = { STATUSES, WORK_TYPES, parseApplication, text, date };
