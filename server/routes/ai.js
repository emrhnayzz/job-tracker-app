const express = require("express");
const { pool } = require("../config/db");
const env = require("../config/env");
const { requireAuth } = require("../middleware/auth");
const { text, WORK_TYPES } = require("../lib/applicationInput");
const { parsePosting } = require("../lib/postingParser");

const router = express.Router();
router.use(requireAuth);

const buildPrompt = ({ lang, name, bio, company, position, description }) => {
  const language = lang === "de" ? "German" : "English";
  return [
    `Write a cover letter in ${language} for the job application below.`,
    "Rules: at most 220 words, concrete and personal, no clichés, no invented facts.",
    "Use only the facts given about the candidate. If something is unknown, leave it out.",
    lang === "de" ? "Use the formal German style (Sie) and end with 'Mit freundlichen Grüßen'." : "",
    "",
    `Candidate: ${name}`,
    `About the candidate: ${bio || "not provided"}`,
    `Company: ${company}`,
    `Position: ${position}`,
    `Job description: ${description || "not provided"}`,
  ].join("\n");
};

// A plain template for when the model cannot be reached. The client labels it
// as a template, so nobody mistakes it for a generated letter.
const templateLetter = ({ lang, name, company, position }) =>
  lang === "de"
    ? `Sehr geehrte Damen und Herren,\n\nmit großem Interesse habe ich Ihre Ausschreibung für die Stelle „${position}“ bei ${company} gelesen.\n\n[Zwei bis drei Sätze: Was bringe ich mit, das genau zu dieser Stelle passt?]\n\n[Ein Satz: Warum dieses Unternehmen?]\n\nÜber die Einladung zu einem persönlichen Gespräch freue ich mich.\n\nMit freundlichen Grüßen\n${name}`
    : `Dear Hiring Team,\n\nI am writing to apply for the ${position} position at ${company}.\n\n[Two or three sentences: what do I bring that fits this role?]\n\n[One sentence: why this company?]\n\nI would welcome the chance to talk in person.\n\nKind regards,\n${name}`;

const askGemini = async (prompt) => {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${env.geminiModel}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": env.geminiKey },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      signal: AbortSignal.timeout(25000),
    }
  );
  if (!response.ok) throw new Error(`gemini_${response.status}`);
  const data = await response.json();
  const letter = data.candidates?.[0]?.content?.parts?.map((part) => part.text).join("").trim();
  if (!letter) throw new Error("gemini_empty");
  return letter;
};

router.post("/cover-letter", async (req, res) => {
  const company = text(req.body.company, 255);
  const position = text(req.body.position, 255);
  if (!company || !position) return res.status(400).json({ error: "company_and_position_required" });

  const user = (await pool.query("SELECT username, bio FROM users WHERE id = $1", [req.userId])).rows[0];
  if (!user) return res.status(401).json({ error: "invalid_token" });

  const input = {
    lang: req.body.lang === "en" ? "en" : "de",
    name: text(req.body.name, 100) || user.username,
    bio: user.bio,
    company,
    position,
    description: text(req.body.description, 3000),
  };

  if (!env.geminiKey) return res.json({ letter: templateLetter(input), source: "template" });

  try {
    res.json({ letter: await askGemini(buildPrompt(input)), source: "ai" });
  } catch (err) {
    console.warn("Cover letter generation failed:", err.message);
    res.json({ letter: templateLetter(input), source: "template" });
  }
});

// Turns a pasted job posting into form fields. The model is asked for strict
// JSON; anything it gets wrong or cannot answer falls back to the rule parser.
const FIELD_PROMPT = [
  "Extract these fields from the job posting below and answer with JSON only, no explanation:",
  '{"company": string|null, "position": string|null, "location": string|null,',
  ' "work_type": "Remote"|"Hybrid"|"On-site"|null, "salary_min": number|null, "salary_max": number|null}',
  "Use null when the posting does not say. Do not guess.",
  "",
].join("\n");

router.post("/parse-posting", async (req, res) => {
  const posting = text(req.body.text, 12000);
  if (!posting || posting.length < 30) return res.status(400).json({ error: "posting_too_short" });

  const rules = parsePosting(posting);
  if (!env.geminiKey) return res.json({ fields: rules, source: "rules" });

  try {
    const answer = await askGemini(FIELD_PROMPT + posting);
    const parsed = JSON.parse(answer.replace(/^```(?:json)?|```$/g, "").trim());
    const number = (value) => (Number.isFinite(Number(value)) && Number(value) > 0 ? Math.round(Number(value)) : null);
    res.json({
      source: "ai",
      fields: {
        company: text(parsed.company, 255) || rules.company,
        position: text(parsed.position, 255) || rules.position,
        location: text(parsed.location, 100) || rules.location,
        work_type: WORK_TYPES.includes(parsed.work_type) ? parsed.work_type : rules.work_type,
        salary_min: number(parsed.salary_min) ?? rules.salary_min ?? null,
        salary_max: number(parsed.salary_max) ?? rules.salary_max ?? null,
      },
    });
  } catch (err) {
    console.warn("Posting analysis failed:", err.message);
    res.json({ fields: rules, source: "rules" });
  }
});

module.exports = router;
