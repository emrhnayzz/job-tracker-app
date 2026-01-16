const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5001;

//Middleware configuration
app.use(cors());
app.use(express());

//Datebase connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

//Database schema
const createTableQuery = `
CREATE TABLE IF NOT EXISTS applications (
 id SERIAL PRIMARY KEY,

 --1.Mandatory Fields (Must be filled)
company VARCHAR(255) NOT NULL,
position VARCHAR(255) NOT NULL,

--2.AUTO-FILLED FIELDS 
status VARCHAR(50) DEFAULT 'Applied',
applied_date DATE DEFAULT CURRENT_DATE,
currency VARCHAR(10) DEFAULT 'EUR',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

--3. Optional Fields
work_type VARCHAR(50),
location VARCHAR(100),

salary_min INTEGER,
salary_max INTEGER,

link TEXT,
description TEXT,

--Recruiter / Contact Info
recruiter_name VARCHAR(100),
recruiter_email VARCHAR(100),

--Personal Notes
notes TEXT,
interview_date TIMESTAMP
);
`;

// Connect and Initialize
pool
  .connect()
  .then((client) => {
    console.log("✅ Connected to PostgreSQL database!");
    return client
      .query(createTableQuery)
      .then(() => {
        console.log(
          "✅ 'applications' table successfully reset with PRO schema."
        );
        client.release();
      })
      .catch((err) => {
        console.error("❌ Error creating table:", err);
        client.release();
      });
  })
  .catch((err) => console.error("❌ Database connection error:", err));

//---API ROUTES---

//1. Get Root
app.get("/", (req, res) => {
  res.send("Jpb Tracker API is running!");
});

//2.Post - Create Applicaiton
app.post("/application", async (req, res) => {
  try {
    const {
      company,
      position,
      status,
      applied_date,
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
      interview_date,
    } = req.body;

    const query = `
            INSERT INTO applications (
              company, position, status, applied_date, work_type, location, 
              salary_min, salary_max, currency, link, description, 
              recruiter_name, recruiter_email, notes, interview_date
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) 
            RETURNING *
          `;

    //If Frontend sends 'null'

    const values = [
      company,
      position,
      status || "Applied", // Fallback if not provided
      applied_date || new Date(), // Fallback to today
      work_type,
      location,
      salary_min,
      salary_max,
      currency || "EUR", // Fallback to EUR
      link,
      description,
      recruiter_name,
      recruiter_email,
      notes,
      interview_date,
    ];

    const newApplication = await pool.query(query, values);

    res.json(newApplication.rows[0]);
    console.log(` Added: ${company} - ${position}`);
  } catch (err) {
    console.error("POST Error:", err.message);
    res.status(500).send("Server Error");
  }
});

//3.Get - List All Applications
app.get("/applications", async (req, res) => {
  try {
    const allApplications = await pool.query(
      "SELECT * FROM applications ORDER BY created_at DESC"
    );
    res.json(allApplications.rows);
  } catch (err) {
    console.error("GET Error:", err.message);
    res.status(500).send("Server Error");
  }
});


app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
