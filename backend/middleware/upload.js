const multer = require('multer');

// Use memory storage - files are stored in memory as Buffer
// This allows direct upload to Cloudinary without saving to disk
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  // Accept images and videos
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image and video files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB max (increased for videos up to 1 minute)
  },
  fileFilter: fileFilter
});

module.exports = upload;

