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


app.get("/", (req, res) => {
  res.send("Backend çalışıyor! 🚀");
});


pool.connect()
  .then(() => console.log("✅ PostgreSQL veritabanına başarıyla bağlanıldı!"))
  .catch((err) => console.error("❌ Veritabanı bağlantı hatası:", err));


app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor...`);
});