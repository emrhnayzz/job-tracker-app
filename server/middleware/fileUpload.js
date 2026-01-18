const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads'); // Go up one level
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

module.exports = upload;