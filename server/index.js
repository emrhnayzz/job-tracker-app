const express = require("express");
const cors = require("cors");
const path = require("path");
const { initDB } = require("./config/db"); 
require("dotenv").config();

// Import Routes
const authRoutes = require("./routes/auth");
const applicationRoutes = require("./routes/applications");
const userRoutes = require("./routes/user");
const aiRoutes = require("./routes/ai"); // <--- NEW AI ROUTE

const app = express();
const PORT = process.env.PORT || 5001;

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- INITIALIZE DATABASE ---
initDB();

// --- USE ROUTES ---
app.use("/auth", authRoutes); 
app.use("/applications", applicationRoutes);
app.use("/users", userRoutes);
app.use("/ai", aiRoutes); // <--- REGISTER AI ROUTE

// --- ROOT ENDPOINT ---
app.get("/", (req, res) => {
  res.send("Job Tracker API Running 🚀");
});

// --- START SERVER ---
app.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});