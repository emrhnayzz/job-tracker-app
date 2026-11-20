// Reads an email about a job application and works out what it means:
// a confirmation of receipt, an interview invitation, a rejection or an offer.
// Plain weighted rules for German and English. No email text leaves the
// server for this, and the result can always be explained by its signals.

const RULES = {
  rejection: [
    [/\bleider\b/i, 2],
    [/\babsagen?\b/i, 3],
    [/nicht (?:weiter )?berücksichtig/i, 3],
    [/andere[nr]? (?:bewerber|kandidat)/i, 3],
    [/nicht in die engere (?:aus)?wahl/i, 3],
    [/keine (?:positive|zusage)/i, 2],
    [/wünschen ihnen .{0,40}(?:alles gute|viel erfolg)/i, 1],
    [/unfortunately/i, 2],
    [/regret to inform/i, 3],
    [/not (?:be )?(?:moving|proceeding|going) forward/i, 3],
    [/other (?:candidates?|applicants?)/i, 2],
    [/(?:decided|chosen) not to/i, 2],
    [/not (?:been )?selected/i, 3],
  ],
  interview: [
    [/vorstellungsgespräch|bewerbungsgespräch|kennenlerngespräch|erstgespräch/i, 3],
    [/persönlich(?:en)? kennenlernen|gern(?:e)? kennenlernen/i, 3],
    [/laden sie .{0,60}\bein\b|einladung zu/i, 3],
    [/terminvorschl|termin vereinbar|passt ihnen|wann .{0,20}zeit/i, 2],
    [/\b(?:teams|zoom|google meet|videocall|video-call)\b/i, 1],
    [/\binterview\b/i, 2],
    [/invite you/i, 3],
    [/schedule (?:a|an|your) (?:call|interview|meeting)/i, 3],
    [/your availability|are you available/i, 2],
    [/(?:would )?like to (?:meet|speak|talk)/i, 2],
  ],
  offer: [
    [/(?<!keine )(?<!keine positive )\bzusage\b/i, 3],
    [/vertragsangebot|arbeitsvertrag|vertragsentwurf/i, 3],
    [/angebot (?:unterbreiten|machen)/i, 3],
    [/freuen uns,? ihnen .{0,60}(?:anbieten|anzubieten)/i, 3],
    [/für sie entschieden/i, 3],
    [/willkommen im team/i, 3],
    [/pleased to offer|job offer|offer letter|offer of employment/i, 3],
    [/welcome (?:to the team|aboard)/i, 2],
  ],
  confirmation: [
    [/eingangsbestätigung/i, 3],
    [/eingang ihrer bewerbung|bewerbung (?:ist )?(?:bei uns )?eingegangen|ihre bewerbung erhalten/i, 3],
    [/(?:vielen dank|danke) für ihre bewerbung/i, 2],
    [/prüfen ihre unterlagen|sichten .{0,30}unterlagen/i, 2],
    [/melden uns .{0,40}(?:bei ihnen|zurück)/i, 1],
    [/received your application|thank you for (?:applying|your application)/i, 3],
    [/we will (?:review|get back)/i, 1],
  ],
};

const MONTHS = {
  januar: 1, january: 1, jan: 1, februar: 2, february: 2, feb: 2, märz: 3, march: 3, mar: 3, april: 4, apr: 4,
  mai: 5, may: 5, juni: 6, june: 6, jun: 6, juli: 7, july: 7, jul: 7, august: 8, aug: 8, september: 9, sep: 9, sept: 9,
  oktober: 10, october: 10, okt: 10, oct: 10, november: 11, nov: 11, dezember: 12, december: 12, dez: 12, dec: 12,
};
const MONTH_NAMES = Object.keys(MONTHS).sort((a, b) => b.length - a.length).join("|");

// Wall-clock time in a time zone -> the matching instant. Emails state times
// as people say them ("10 Uhr"), so they have to be read in the app's zone.
const zonedTime = (year, month, day, hour, minute, timeZone) => {
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone, hour12: false, year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric",
  }).formatToParts(new Date(guess));
  const read = (type) => Number(parts.find((part) => part.type === type).value);
  const shown = Date.UTC(read("year"), read("month") - 1, read("day"), read("hour") % 24, read("minute"));
  return new Date(guess - (shown - guess));
};

const findTime = (after) => {
  const clock = after.match(/(\d{1,2})[:.](\d{2})\s*(uhr|am|pm|a\.m\.|p\.m\.)?/i);
  const short = after.match(/(\d{1,2})\s*(uhr|am|pm|a\.m\.|p\.m\.)/i);
  const found = clock && (!short || clock.index <= short.index) ? clock : short;
  if (!found) return null;
  let hour = Number(found[1]);
  const minute = found === clock ? Number(found[2]) : 0;
  const suffix = ((found === clock ? found[3] : found[2]) || "").toLowerCase();
  if (suffix.startsWith("p") && hour < 12) hour += 12;
  if (suffix.startsWith("a") && hour === 12) hour = 0;
  return hour <= 23 && minute <= 59 ? { hour, minute } : null;
};

// Finds the first date in the text, with a time if one follows it.
const findDate = (text, { now = new Date(), timeZone = "Europe/Berlin" } = {}) => {
  const candidates = [
    // The year must not be the start of a time such as "09:15".
    [/(\d{1,2})\.\s?(\d{1,2})\.(?:\s?(\d{4}|\d{2})(?![:.]?\d))?/, (m) => [Number(m[1]), Number(m[2]), m[3]]],
    [new RegExp(`(\\d{1,2})\\.?(?:st|nd|rd|th)?\\s+(${MONTH_NAMES})\\.?(?:,?\\s+(\\d{4}))?`, "i"), (m) => [Number(m[1]), MONTHS[m[2].toLowerCase()], m[3]]],
    [new RegExp(`(${MONTH_NAMES})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(\\d{4}))?`, "i"), (m) => [Number(m[2]), MONTHS[m[1].toLowerCase()], m[3]]],
  ];

  let best = null;
  for (const [pattern, read] of candidates) {
    const match = text.match(pattern);
    if (match && (!best || match.index < best.match.index)) best = { match, read };
  }
  if (!best) return null;

  const [day, month, rawYear] = best.read(best.match);
  if (!(day >= 1 && day <= 31 && month >= 1 && month <= 12)) return null;
  const time = findTime(text.slice(best.match.index + best.match[0].length, best.match.index + best.match[0].length + 60));
  let year = rawYear ? Number(rawYear.length === 2 ? `20${rawYear}` : rawYear) : now.getFullYear();
  let date = zonedTime(year, month, day, time?.hour ?? 9, time?.minute ?? 0, timeZone);
  // "am 5. Januar" written in December means next year.
  if (!rawYear && date.getTime() < now.getTime() - 30 * 24 * 60 * 60 * 1000) {
    year += 1;
    date = zonedTime(year, month, day, time?.hour ?? 9, time?.minute ?? 0, timeZone);
  }
  return date;
};

const classifyMail = ({ subject = "", text = "" }, options) => {
  const content = `${subject}\n${text}`;
  const scores = {};
  const signals = {};
  for (const [kind, rules] of Object.entries(RULES)) {
    scores[kind] = 0;
    signals[kind] = [];
    for (const [pattern, weight] of rules) {
      const match = content.match(pattern);
      if (match) {
        scores[kind] += weight;
        signals[kind].push(match[0]);
      }
    }
  }

  // A rejection usually thanks for the application first, so a clear "no"
  // outranks the polite opening. An offer outranks an invitation.
  const ranked = Object.keys(scores).sort((a, b) => scores[b] - scores[a]);
  let kind = ranked[0];
  if (scores.rejection >= 3 && scores.offer <= scores.rejection) kind = "rejection";
  else if (scores.offer >= 3 && scores.offer >= scores.interview) kind = "offer";

  const top = scores[kind];
  if (top < 2) return { kind: "unknown", confidence: 0, signals: [], interviewDate: null };

  const rival = Math.max(...Object.keys(scores).filter((key) => key !== kind && key !== "confirmation").map((key) => scores[key]));
  const confidence = Math.min(1, top / 5) * (1 - (rival / (top + rival)) * 0.6);

  return {
    kind,
    confidence: Math.round(confidence * 100) / 100,
    signals: signals[kind],
    interviewDate: kind === "interview" ? findDate(text, options) : null,
  };
};

// ---- Which application is this email about? ----

const GENERIC = new Set([
  "gmbh", "ag", "se", "kg", "ug", "inc", "ltd", "llc", "co", "the", "und", "and", "der", "die", "das",
  "software", "digital", "systems", "solutions", "group", "labs", "studios", "cloud", "services", "consulting",
]);
const normalise = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/[^a-z0-9äöüß]+/g, " ")
    .trim();
const compact = (value) => normalise(value).replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss").replace(/ /g, "");

const matchApplication = (mail, applications) => {
  // Padded with spaces so that names only match as whole words:
  // a company called "R" must not match every "r" in the text.
  const content = ` ${normalise(`${mail.subject} ${mail.text}`)} `;
  const contentWords = new Set(content.split(" "));
  const sender = compact(mail.sender);
  const ACTIVE = { Applied: 2, Interview: 2, Saved: 1, Offer: 0, Rejected: 0 };

  let best = null;
  for (const application of applications) {
    const name = normalise(application.company);
    const words = name.split(" ").filter((word) => word.length >= 3 && !GENERIC.has(word));
    const distinctive = words.sort((a, b) => b.length - a.length)[0];
    let score = 0;

    if (name.length >= 3 && content.includes(` ${name} `)) score += 5;
    if (distinctive && distinctive.length >= 4 && sender.includes(compact(distinctive))) score += 4;
    if (name.length >= 4 && sender.includes(compact(name))) score += 2;
    score += Math.min(words.filter((word) => contentWords.has(word)).length, 2) * 2;
    const position = normalise(application.position);
    if (position.length >= 8 && content.includes(` ${position} `)) score += 2;

    if (score >= 4) {
      const ranked = score * 10 + (ACTIVE[application.status] ?? 0);
      if (!best || ranked > best.ranked) best = { application, score, ranked };
    }
  }
  return best ? best.application : null;
};

// What the email means for the application's status. A confirmation only
// moves a job that was merely saved; everything else follows the email.
const proposedStatus = (kind, currentStatus) => {
  if (kind === "rejection") return "Rejected";
  if (kind === "offer") return "Offer";
  if (kind === "interview") return "Interview";
  if (kind === "confirmation" && currentStatus === "Saved") return "Applied";
  return null;
};

module.exports = { classifyMail, matchApplication, proposedStatus, findDate };
