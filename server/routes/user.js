const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { pool } = require("../config/db");
const upload = require("../middleware/fileUpload");

// GET USER INFO (By ID)
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await pool.query(
      "SELECT id, username, email, created_at, avatar_path FROM users WHERE id = $1",
      [id]
    );

    if (user.rows.length === 0)
      return res.status(404).json({ message: "User not found" });

    res.json(user.rows[0]);
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

// UPDATE PROFILE (Avatar + Info + Password)
router.put("/:id", upload.single("avatar"), async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, password } = req.body;
    const avatarPath = req.file ? req.file.path : null;

    // 1. Get current user data
    const currentUser = await pool.query("SELECT * FROM users WHERE id = $1", [
      id,
    ]);
    if (currentUser.rows.length === 0)
      return res.status(404).json({ message: "User not found" });

    let newPasswordHash = currentUser.rows[0].password_hash;

    // 2. If password provided, hash it
    if (password && password.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      newPasswordHash = await bcrypt.hash(password, salt);
    }

    // 3. Update User (Coalesce keeps old value if new is null)
    const updateQuery = `
      UPDATE users SET 
        username = COALESCE($1, username),
        email = COALESCE($2, email),
        password_hash = $3,
        avatar_path = COALESCE($4, avatar_path)
      WHERE id = $5
      RETURNING id, username, email, avatar_path;
    `;

    const updatedUser = await pool.query(updateQuery, [
      username || null,
      email || null,
      newPasswordHash,
      avatarPath,
      id,
    ]);

    res.json(updatedUser.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
