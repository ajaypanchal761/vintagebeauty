const express = require('express');
const router = express.Router();
const {
  registerAdmin,
  loginAdmin,
  getAdmins,
  getAdmin,
  getMe,
  updateAdminProfile
} = require('../controller/adminController');
const { protectAdmin } = require('../middleware/adminAuth');

// Public routes (for registration and login)
router.post('/register', registerAdmin);
router.post('/login', loginAdmin);

// Protected admin routes - use adminAuth middleware
router.get('/me', protectAdmin, getMe);
router.put('/me', protectAdmin, updateAdminProfile);
router.get('/', protectAdmin, getAdmins);
router.get('/:id', protectAdmin, getAdmin);

module.exports = router;




