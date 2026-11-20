// Finds known skills in free text and compares a job posting with a profile.
// Everything runs in the browser: no text leaves the device for this.

const SKILLS = [
  ["JavaScript", /\bjavascript\b|\bES6\b/i],
  ["TypeScript", /\btypescript\b/i],
  ["React Native", /\breact[- ]native\b/i],
  ["React", /\breact(?:\.js)?\b(?![- ]native)/i],
  ["Expo", /\bexpo\b/i],
  ["Next.js", /\bnext\.?js\b/i],
  ["Redux", /\bredux\b/i],
  ["Vue", /\bvue(?:\.js)?\b/i],
  ["Angular", /\bangular\b/i],
  ["Svelte", /\bsvelte\b/i],
  ["Node.js", /\bnode(?:\.js)?\b/i],
  ["Express", /\bexpress(?:\.js)?\b/i],
  ["Python", /\bpython\b/i],
  ["Django", /\bdjango\b/i],
  ["Java", /\bjava\b(?!script)/i],
  ["Spring", /\bspring(?: boot)?\b/i],
  ["Kotlin", /\bkotlin\b/i],
  ["Swift", /\bswift\b(?!ui)/i],
  ["SwiftUI", /\bswiftui\b/i],
  ["Flutter", /\bflutter\b/i],
  ["C#", /\bC#|\.NET\b/],
  ["C++", /\bC\+\+/],
  ["PHP", /\bphp\b/i],
  ["SQL", /\bsql\b/i],
  ["PostgreSQL", /\bpostgres(?:ql)?\b/i],
  ["MySQL", /\bmysql\b/i],
  ["MongoDB", /\bmongo(?:db)?\b/i],
  ["Supabase", /\bsupabase\b/i],
  ["Firebase", /\bfirebase\b/i],
  ["GraphQL", /\bgraphql\b/i],
  ["REST", /\bREST(?:ful)?\b|\brest[- ]api/i],
  ["Docker", /\bdocker\b/i],
  ["Kubernetes", /\bkubernetes\b|\bk8s\b/i],
  ["AWS", /\bAWS\b|amazon web services/i],
  ["Azure", /\bazure\b/i],
  ["CI/CD", /\bCI\/CD\b|continuous integration/i],
  ["GitHub Actions", /\bgithub actions\b/i],
  ["Git", /\bgit\b/i],
  ["Linux", /\blinux\b/i],
  ["HTML", /\bhtml5?\b/i],
  ["CSS", /\bcss3?\b/i],
  ["Tailwind", /\btailwind\b/i],
  ["Sass", /\bsass\b|\bscss\b/i],
  ["Bootstrap", /\bbootstrap\b/i],
  ["Figma", /\bfigma\b/i],
  ["Jira", /\bjira\b/i],
  ["Confluence", /\bconfluence\b/i],
  ["Scrum", /\bscrum\b/i],
  ["Agile", /\bagile?\b/i],
  ["Jest", /\bjest\b/i],
  ["Testing", /\bunit[- ]?tests?\b|testautomatisierung|test automation|\btests? schreib/i],
  ["Xcode", /\bxcode\b/i],
  ["App Store", /\bapp[- ]store\b/i],
  ["Google Play", /\bgoogle play\b|\bplay store\b/i],
  ["RevenueCat", /\brevenuecat\b/i],
  ["Sentry", /\bsentry\b/i],
  ["Postman", /\bpostman\b/i],
  ["SAP", /\bSAP\b/],
  ["Power BI", /\bpower ?bi\b/i],
  ["Power Automate", /\bpower automate\b/i],
  ["Excel", /\bexcel\b/i],
  ["LLM", /\bLLMs?\b|large language model/i],
  ["Machine Learning", /\bmachine learning\b|maschinelles lernen/i],
  ["User Stories", /\buser stor(?:y|ies)\b/i],
  ["Projektmanagement", /\bprojektmanagement\b|\bproject management\b/i],
  ["Produktmanagement", /\bprodukt ?management\b|\bproduct management\b/i],
  ["Datenanalyse", /\bdatenanalyse\b|\bdata analysis\b|\bdata analytics\b/i],
  ["UX/UI", /\bUX\b|\bUI\/UX\b|\busability\b/],
  ["Tableau", /\btableau\b/i],
];

export const extractSkills = (text) => {
  if (!text) return [];
  return SKILLS.filter(([, pattern]) => pattern.test(text)).map(([name]) => name);
};

// Compares what a posting asks for with what the profile mentions.
// Returns null when the posting names fewer than two known skills, because a
// percentage would mean nothing then.
export const matchSkills = (application, user) => {
  const wanted = extractSkills(`${application.position || ""}\n${application.description || ""}`);
  if (wanted.length < 2) return null;
  const mine = new Set(extractSkills(`${user.skills || ""}\n${user.bio || ""}`));
  const matched = wanted.filter((skill) => mine.has(skill));
  const missing = wanted.filter((skill) => !mine.has(skill));
  return { matched, missing, score: Math.round((matched.length / wanted.length) * 100), hasProfile: mine.size > 0 };
};
