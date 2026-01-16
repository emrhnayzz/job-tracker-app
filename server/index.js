const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// --- SCHEMA DEFINITION ---
const createTableQuery = `
  -- !!! IMPORTANT: This line resets the table to ensure all columns exist.
  -- After running successfully once, you can comment the next line out to keep your data.
  --DROP TABLE IF EXISTS applications; 
  
  CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    company VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'Applied',
    applied_date DATE DEFAULT CURRENT_DATE,
    work_type VARCHAR(50),
    location VARCHAR(100),
    salary_min INTEGER,
    salary_max INTEGER,
    currency VARCHAR(10) DEFAULT 'EUR',
    link TEXT,
    description TEXT,
    recruiter_name VARCHAR(100),
    recruiter_email VARCHAR(100),
    notes TEXT,
    interview_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

pool
  .connect()
  .then((client) => {
    console.log("✅ DB Connected");
    return client
      .query(createTableQuery)
      .then(() => {
        console.log("✅ Table 'applications' reset & ready.");
        client.release();
      })
      .catch((err) => {
        console.error("❌ Table creation error:", err);
        client.release();
      });
  })
  .catch((err) => console.error("❌ Connection error:", err));

app.get("/", (req, res) => {
  res.send("Job Tracker API Running 🚀");
});

// --- POST ENDPOINT (Fixed & Robust) ---
app.post("/applications", async (req, res) => {
  try {
    const {
      company,
      position,
      status,
      work_type,
      location,
      salary_min,
      salary_max,
      currency,
      link,
      description,
      recruiter_name,
      recruiter_email,
      notes,
    } = req.body;

    // Helper: Convert empty strings to NULL (Postgres hates empty strings for INTEGERS)
    const cleanInt = (val) =>
      val === "" || val === null ? null : parseInt(val);
    const cleanStr = (val) => (val === "" ? null : val);

    const query = `
      INSERT INTO applications (
        company, position, status, work_type, location, 
        salary_min, salary_max, currency, link, description, 
        recruiter_name, recruiter_email, notes
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
      RETURNING *
    `;

    const values = [
      company,
      position,
      status || "Applied",
      cleanStr(work_type),
      cleanStr(location),
      cleanInt(salary_min), // Safe integer conversion
      cleanInt(salary_max), // Safe integer conversion
      currency || "EUR",
      cleanStr(link),
      cleanStr(description),
      cleanStr(recruiter_name),
      cleanStr(recruiter_email),
      cleanStr(notes),
    ];

    const newApp = await pool.query(query, values);
    res.json(newApp.rows[0]);
    console.log(`🆕 Added: ${company}`);
  } catch (err) {
    console.error("❌ POST Error Details:", err.message); // This will show in terminal
    res.status(500).send("Server Error: " + err.message);
  }
});

app.get("/applications", async (req, res) => {
  try {
    const allApps = await pool.query(
      "SELECT * FROM applications ORDER BY created_at DESC"
    );
    res.json(allApps.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});
