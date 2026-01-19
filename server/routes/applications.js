const express = require("express");
const router = express.Router();
const { pool } = require("../config/db");
const upload = require("../middleware/fileUpload");

// GET ALL (Filtered by User ID)
router.get("/", async (req, res) => {
  try {
    // Get userId from query params (sent from frontend)
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "User ID required" });
    }

    // SQL: Select only applications belonging to this user
    const query = "SELECT * FROM applications WHERE user_id = $1 ORDER BY created_at DESC";
    const allApps = await pool.query(query, [userId]);
    
    res.json(allApps.rows);
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

// CREATE (POST) - Saves User ID
router.post("/", upload.single('cv'), async (req, res) => {
  try {
    const cvPath = req.file ? req.file.path : null; 
    const { 
      company, position, status, applied_date, work_type, location, 
      salary_min, salary_max, currency, link, description, 
      recruiter_name, recruiter_email, notes,
      user_id // <--- Receive user_id from frontend
    } = req.body;

    const cleanInt = (val) => (val === '' || val === 'null' ? null : parseInt(val));
    const cleanStr = (val) => (val === '' || val === 'null' ? null : val);

    const query = `
      INSERT INTO applications (
        user_id, company, position, status, applied_date, work_type, location, 
        salary_min, salary_max, currency, link, description, 
        recruiter_name, recruiter_email, notes, cv_path
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *
    `;
    
    const values = [
      cleanInt(user_id), // $1
      company, position, status || 'Applied', applied_date || new Date(), 
      cleanStr(work_type), cleanStr(location),
      cleanInt(salary_min), cleanInt(salary_max), currency || 'EUR',
      cleanStr(link), cleanStr(description),
      cleanStr(recruiter_name), cleanStr(recruiter_email), cleanStr(notes),
      cvPath
    ];
    
    const newApp = await pool.query(query, values);
    res.json(newApp.rows[0]);
  } catch (err) {
    res.status(500).send("Server Error: " + err.message);
  }
});

// DELETE
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleteOp = await pool.query("DELETE FROM applications WHERE id = $1 RETURNING *", [id]);
    if (deleteOp.rowCount === 0) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

// UPDATE (PUT)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      company, position, status, applied_date, work_type, location, 
      salary_min, salary_max, currency, link, description, 
      recruiter_name, recruiter_email, notes 
    } = req.body;

    const cleanInt = (val) => (!val && val !== 0 ? null : parseInt(val));
    const cleanStr = (val) => (!val ? null : val);

    const query = `
      UPDATE applications SET 
        company = $1, position = $2, status = $3, applied_date = $4, 
        work_type = $5, location = $6, salary_min = $7, salary_max = $8, 
        currency = $9, link = $10, description = $11, 
        recruiter_name = $12, recruiter_email = $13, notes = $14
      WHERE id = $15 RETURNING *
    `;

    const values = [
      company, position, status, applied_date, cleanStr(work_type), cleanStr(location), 
      cleanInt(salary_min), cleanInt(salary_max), currency, 
      cleanStr(link), cleanStr(description), cleanStr(recruiter_name), cleanStr(recruiter_email), cleanStr(notes), 
      id
    ];

    const updateOp = await pool.query(query, values);
    if (updateOp.rowCount === 0) return res.status(404).json({ message: "Not found" });
    res.json(updateOp.rows[0]);
  } catch (err) {
    console.error("PUT Error:", err.message);
    res.status(500).send("Server Error: " + err.message);
  }
});

module.exports = router;