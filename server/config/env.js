require("dotenv").config({ quiet: true });
const crypto = require("crypto");

const isTest = process.env.NODE_ENV === "test";
const isProd = process.env.NODE_ENV === "production";

// Without a configured secret we still start, but with a random one:
// tokens then stop working when the server restarts. Never fall back to a
// hard-coded secret, because anyone who reads the source could forge tokens.
let jwtSecret = process.env.SECRET_KEY;
if (!jwtSecret) {
  jwtSecret = crypto.randomBytes(32).toString("hex");
  if (!isTest) {
    console.warn("SECRET_KEY is not set: using a random secret, sessions end on restart.");
  }
}

const clientOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

module.exports = {
  isTest,
  isProd,
  port: Number(process.env.PORT) || 5001,
  databaseUrl: isTest ? process.env.TEST_DATABASE_URL : process.env.DATABASE_URL,
  databaseSsl: process.env.DATABASE_SSL === "true",
  jwtSecret,
  clientOrigins,
  geminiKey: process.env.GEMINI_API_KEY || "",
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
};
