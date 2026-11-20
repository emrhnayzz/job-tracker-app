// Small automatic rules that keep an application tidy when its status changes.

const FOLLOW_UP_AFTER_DAYS = 10;

// An application that leaves "Saved" has been sent: stamp the date if missing.
const appliedDateFor = (status, appliedDate) => (status !== "Saved" && !appliedDate ? new Date() : appliedDate);

// When an application becomes "Applied", plan a follow-up unless one is set.
const followUpFor = (status, previousStatus, followUpDate) => {
  if (status !== "Applied" || previousStatus === "Applied" || followUpDate) return followUpDate ?? null;
  const day = new Date();
  day.setDate(day.getDate() + FOLLOW_UP_AFTER_DAYS);
  return day;
};

module.exports = { appliedDateFor, followUpFor, FOLLOW_UP_AFTER_DAYS };
