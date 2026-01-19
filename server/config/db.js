const { Pool } = require("pg");
require("dotenv").config();

// Create Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Database Initialization (Tables & Migrations)
const initDB = async () => {
  const queryText = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      avatar_path TEXT, 
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS applications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id), -- This line is for new tables
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
      cv_path TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    const client = await pool.connect();
    // 1. Create Tables (if not exists)
    await client.query(queryText);

    // --- MIGRATIONS (Fixes existing tables) ---

    // Migration 1: Add cv_path
    await client.query(
      `ALTER TABLE applications ADD COLUMN IF NOT EXISTS cv_path TEXT;`
    );

    // Migration 2: Add avatar_path
    await client.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_path TEXT;`
    );

    // Migration 3: Add user_id (CRITICAL FIX 🚨)

    await client.query(`
        ALTER TABLE applications 
        ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);
    `);

    console.log("✅ Database initialized successfully.");
    client.release();
  } catch (err) {
    console.error("❌ Database init error:", err);
  }
};

module.exports = { pool, initDB };
