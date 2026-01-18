const express = require("express");
const cors = require("cors");
const { initDB } = require("./config/db");

const authRoutes = require("./routes/auth");
const applicationRoutes = require("./routes/applications");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5001;

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());
// Serve uploaded files statically
app.use("/uploads", express.static("uploads"));

// --- INITIALIZE DATABASE ---
initDB();

// --- USE ROUTES ---
// All routes starting with /auth go to authRoutes
app.use("/auth", authRoutes);

// All routes starting with /applications go to applicationRoutes
app.use("/applications", applicationRoutes);

// --- ROOT ENDPOINT ---
app.get("/", (req, res) => {
  res.send("Job Tracker API Running 🚀 (Modular Version)");
});

// --- START SERVER ---
app.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});
