const multer = require('multer');

// Use memory storage - files are stored in memory as Buffer
// This allows direct upload to Cloudinary without saving to disk
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  // Accept images only
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB (increased for better quality images)
  },
  fileFilter: fileFilter
});

module.exports = upload;

