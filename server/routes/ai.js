const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/generate", async (req, res) => {
  const { company, position, description, userName } = req.body;
  const user = userName || "Job Seeker";

  try {

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Write a professional cover letter for a job application.
      Candidate: ${user}
      Company: ${company}
      Position: ${position}
      Job Desc: ${description ? description.slice(0, 500) : "N/A"}
      Keep it under 200 words.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return res.json({ letter: text });

  } catch (err) {
    console.log("⚠️ AI API Failed (Region/Quota Issue). Switching to Fallback Mode.");
    

    const fallbackLetter = `Dear Hiring Manager at ${company},

I am writing to express my enthusiastic interest in the ${position} role. With a strong passion for technology and a dedication to continuous learning, I am confident in my ability to contribute effectively to your team.

${description ? `I was particularly drawn to this opportunity because of the requirement for: "${description.slice(0, 50)}...". My background aligns well with these needs.` : "I have followed your company's work for some time and admire your commitment to innovation."}

I am eager to bring my problem-solving skills and technical expertise to ${company}. Thank you for considering my application. I look forward to the possibility of discussing how I can contribute to your success.

Sincerely,
${user}
[Phone Number]
[Email Address]`;


    setTimeout(() => {
        res.json({ letter: fallbackLetter });
    }, 1000);
  }
});

module.exports = router;