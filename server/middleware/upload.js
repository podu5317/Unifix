// Advanced feature: file/image upload (evidence of fault) using multer.
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    // unique name: evidence-<timestamp>-<random>.<ext>
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `evidence-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('Only image files (jpg, png, gif, webp) are allowed.'));
}

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});
