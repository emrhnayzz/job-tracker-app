const { Pool } = require("pg");
const env = require("./env");

const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: env.databaseSsl ? { rejectUnauthorized: false } : undefined,
});

// Every statement is idempotent, so the same script creates a fresh database
// and upgrades an existing one.
const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_path TEXT;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS skills TEXT;
  ALTER TABLE users ADD COLUMN IF NOT EXISTS weekly_goal INTEGER NOT NULL DEFAULT 5;

  CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
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
  ALTER TABLE applications ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);
  ALTER TABLE applications ADD COLUMN IF NOT EXISTS cv_path TEXT;
  ALTER TABLE applications ADD COLUMN IF NOT EXISTS cv_name TEXT;
  ALTER TABLE applications ADD COLUMN IF NOT EXISTS follow_up_date DATE;
  ALTER TABLE applications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  ALTER TABLE applications ADD COLUMN IF NOT EXISTS interest SMALLINT;
  ALTER TABLE applications ALTER COLUMN applied_date DROP DEFAULT;
  CREATE INDEX IF NOT EXISTS applications_user_idx ON applications (user_id);

  CREATE TABLE IF NOT EXISTS application_events (
    id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,
    from_status VARCHAR(50),
    to_status VARCHAR(50),
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS application_events_app_idx ON application_events (application_id);

  CREATE TABLE IF NOT EXISTS application_tasks (
    id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    done BOOLEAN NOT NULL DEFAULT FALSE,
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS application_tasks_app_idx ON application_tasks (application_id);
`;

const initDB = async () => {
  await pool.query(SCHEMA);
};

module.exports = { pool, initDB };
