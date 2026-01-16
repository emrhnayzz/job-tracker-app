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

/* --- DATABASE SCHEMA --- */
const createTableQuery = `
  -- Un-comment the next line ONLY if you want to reset the table (Delete all data)
  -- DROP TABLE IF EXISTS applications;
  
  CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    company VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'Applied',
    applied_date DATE DEFAULT CURRENT_DATE,  -- Ensure this column exists
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
        console.log("✅ Table check completed.");
        client.release();
      })
      .catch((err) => {
        console.error("❌ Table creation error:", err);
        client.release();
      });
  })
  .catch((err) => console.error("❌ Database connection error:", err));

app.get("/", (req, res) => {
  res.send("Job Tracker API Running 🚀");
});

// --- POST ENDPOINT (Fixed for Date & Parameters) ---
app.post("/applications", async (req, res) => {
  try {
    console.log("📥 New Application Request:", req.body); // Debug Log

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
    } = req.body;

    // Helpers to clean empty strings
    const cleanInt = (val) =>
      val === "" || val === null ? null : parseInt(val);
    const cleanStr = (val) => (val === "" ? null : val);

    // SQL Query: Must have exactly 14 placeholders ($1 to $14)
    const query = `
      INSERT INTO applications (
        company, position, status, applied_date, work_type, location, 
        salary_min, salary_max, currency, link, description, 
        recruiter_name, recruiter_email, notes
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
      RETURNING *
    `;

    // Values Array: Must have exactly 14 items
    const values = [
      company,
      position,
      status || "Applied",
      applied_date || new Date(), // Handle date
      cleanStr(work_type),
      cleanStr(location),
      cleanInt(salary_min),
      cleanInt(salary_max),
      currency || "EUR",
      cleanStr(link),
      cleanStr(description),
      cleanStr(recruiter_name),
      cleanStr(recruiter_email),
      cleanStr(notes),
    ];

    const newApp = await pool.query(query, values);

    console.log("✅ Saved to DB:", newApp.rows[0].company);
    res.json(newApp.rows[0]);
  } catch (err) {
    console.error("❌ POST Error Details:", err.message); // Look at terminal for this!
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

// 4. DELETE - Remove an application by ID
app.delete("/applications/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // DELETE query
    const deleteOp = await pool.query(
      "DELETE FROM applications WHERE id = $1 RETURNING *",
      [id]
    );

    if (deleteOp.rowCount === 0) {
      return res.status(404).json({ message: "Application not found" });
    }

    res.json({ message: "Application deleted successfully!" });
    console.log(`🗑️ Deleted Application ID: ${id}`);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// 5. UPDATE - Modify an existing application by ID
app.put("/applications/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { 
        company, position, status, applied_date, work_type, location, 
        salary_min, salary_max, currency, link, description, 
        recruiter_name, recruiter_email, notes 
      } = req.body;
  
      // Helpers to clean data (same as POST)
      const cleanInt = (val) => (val === '' || val === null ? null : parseInt(val));
      const cleanStr = (val) => (val === '' ? null : val);
  
      // SQL Update Query
      const query = `
        UPDATE applications SET 
          company = $1, position = $2, status = $3, applied_date = $4, 
          work_type = $5, location = $6, salary_min = $7, salary_max = $8, 
          currency = $9, link = $10, description = $11, 
          recruiter_name = $12, recruiter_email = $13, notes = $14
        WHERE id = $15
        RETURNING *
      `;
  
      const values = [
        company, position, status, applied_date, 
        cleanStr(work_type), cleanStr(location), 
        cleanInt(salary_min), cleanInt(salary_max), currency, 
        cleanStr(link), cleanStr(description), 
        cleanStr(recruiter_name), cleanStr(recruiter_email), cleanStr(notes), 
        id
      ];
  
      const updateOp = await pool.query(query, values);
      
      if (updateOp.rowCount === 0) {
         return res.status(404).json({ message: "Application not found" });
      }
  
      res.json(updateOp.rows[0]);
      console.log(`📝 Updated Application ID: ${id}`);
  
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  });

app.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});
