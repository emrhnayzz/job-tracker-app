// Pulls the basic fields out of a pasted job posting with plain rules.
// It is the fallback when no language model is available, and it is good
// enough for typical German and English postings.

const GENDER_TAG = /\((?:[mwfdx]\s*\/\s*){1,3}[mwfdx]\)|\(all genders\)|\(gn\)/i;
const LEGAL_FORM = "GmbH & Co\\. KG|gGmbH|GmbH|AG|SE|KG|UG|e\\. ?V\\.|Inc\\.?|Ltd\\.?|LLC|B\\.V\\.";
const COMPANY = new RegExp(`((?:[A-ZÄÖÜ0-9][\\wÄÖÜäöüß&.+-]*\\s){1,5}(?:${LEGAL_FORM}))(?![\\w])`);
const CITIES = [
  "Berlin", "Hamburg", "München", "Köln", "Frankfurt", "Stuttgart", "Düsseldorf", "Leipzig", "Dresden", "Dortmund",
  "Essen", "Bremen", "Hannover", "Nürnberg", "Jena", "Erfurt", "Weimar", "Gera", "Halle", "Magdeburg", "Chemnitz",
  "Karlsruhe", "Mannheim", "Heidelberg", "Freiburg", "Bonn", "Münster", "Aachen", "Augsburg", "Kiel", "Rostock",
  "Potsdam", "Regensburg", "Würzburg", "Darmstadt", "Wien", "Zürich",
];

// "Die Nordlicht Software GmbH" -> "Nordlicht Software GmbH"
const LEAD_IN = /^(?:Die|Der|Das|Bei|Für|Wir|Über|Von|The|At|About|Join)\s+/;
const stripLeadIn = (name) => {
  let result = name;
  while (LEAD_IN.test(result)) result = result.replace(LEAD_IN, "");
  return result;
};

const toNumber = (raw) => {
  // "45.000" and "45,000" are thousands; "15,50" is a decimal amount.
  const cleaned = /[.,]\d{3}$/.test(raw) ? raw.replace(/[.,]/g, "") : raw.replace(",", ".");
  const value = Math.round(Number.parseFloat(cleaned));
  return Number.isFinite(value) ? value : null;
};

const findSalary = (text) => {
  const amount = "(\\d{1,3}(?:[.,]\\d{3})?(?:[.,]\\d{1,2})?)";
  const currency = "(?:€|EUR|Euro)";
  const patterns = [
    new RegExp(`${amount}\\s*(?:-|–|bis|to)\\s*${amount}\\s*${currency}`, "i"),
    new RegExp(`${currency}\\s*${amount}\\s*(?:-|–|bis|to)\\s*${amount}`, "i"),
    new RegExp(`${amount}\\s*${currency}()`, "i"),
    new RegExp(`${currency}\\s*${amount}()`, "i"),
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const min = toNumber(match[1]);
      const max = match[2] ? toNumber(match[2]) : min;
      if (min) return { salary_min: min, salary_max: max || min };
    }
  }
  return {};
};

const findWorkType = (text) => {
  if (/hybrid/i.test(text)) return "Hybrid";
  if (/\bremote\b|home[- ]?office|mobiles? arbeiten/i.test(text)) return "Remote";
  if (/vor ort|on[- ]?site|präsenz/i.test(text)) return "On-site";
  return null;
};

const findLocation = (text) => {
  const labelled = text.match(/(?:Standort|Arbeitsort|Einsatzort|Location|Ort)\s*[:：]\s*([^\n,;|(]{2,60})/i);
  if (labelled) return labelled[1].trim();
  const city = CITIES.find((name) => new RegExp(`(^|[^\\wÄÖÜäöüß])${name}([^\\wÄÖÜäöüß]|$)`).test(text));
  return city || null;
};

const findPosition = (lines) => {
  const tagged = lines.find((line) => GENDER_TAG.test(line) && line.length <= 140);
  if (tagged) return tagged;
  const titled = lines.find((line) => /werkstudent|praktik|developer|entwickler|engineer|manager|consultant|analyst/i.test(line) && line.length <= 120);
  return titled || lines.find((line) => line.length >= 4 && line.length <= 120) || null;
};

const parsePosting = (rawText) => {
  const text = String(rawText || "").replace(/\r/g, "").trim();
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const company = text.match(COMPANY);

  return {
    company: company ? stripLeadIn(company[1].trim()) : null,
    position: findPosition(lines),
    location: findLocation(text),
    work_type: findWorkType(text),
    ...findSalary(text),
  };
};

module.exports = { parsePosting };
