const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");

const SECRET_KEY = process.env.SECRET_KEY || "my_super_secret_key_123";

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    const userCheck = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userCheck.rows.length > 0) return res.status(400).json({ message: "User exists!" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email",
      [username, email, hashedPassword]
    );

    res.json(newUser.rows[0]);
  } catch (err) {
    res.status(500).send("Server Error: " + err.message);
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    
    if (user.rows.length === 0) return res.status(400).json({ message: "Invalid Credentials" });

    const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
    if (!validPassword) return res.status(400).json({ message: "Invalid Credentials" });

    const token = jwt.sign({ id: user.rows[0].id }, SECRET_KEY, { expiresIn: "1h" });
    res.json({ token, user: { id: user.rows[0].id, username: user.rows[0].username } });
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

module.exports = router;