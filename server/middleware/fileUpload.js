const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const UPLOAD_ROOT = path.join(__dirname, "..", "uploads");
const CV_DIR = path.join(UPLOAD_ROOT, "cv");
const AVATAR_DIR = path.join(UPLOAD_ROOT, "avatars");
for (const dir of [CV_DIR, AVATAR_DIR]) fs.mkdirSync(dir, { recursive: true });

const storageFor = (dir) =>
  multer.diskStorage({
    destination: dir,
    // Random names: the stored file can never be guessed from the original name.
    filename: (req, file, cb) =>
      cb(null, crypto.randomBytes(16).toString("hex") + path.extname(file.originalname).toLowerCase()),
  });

const onlyTypes = (types) => (req, file, cb) => {
  if (types.includes(file.mimetype)) return cb(null, true);
  const err = new Error("unsupported_file_type");
  err.status = 400;
  cb(err);
};

const uploadCv = multer({
  storage: storageFor(CV_DIR),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: onlyTypes(["application/pdf"]),
}).single("cv");

const uploadAvatar = multer({
  storage: storageFor(AVATAR_DIR),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: onlyTypes(["image/jpeg", "image/png", "image/webp"]),
}).single("avatar");

const removeFile = (absolutePath) => fs.promises.unlink(absolutePath).catch(() => {});

module.exports = { uploadCv, uploadAvatar, removeFile, CV_DIR, AVATAR_DIR };
