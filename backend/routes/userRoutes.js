const express = require('express');
const router = express.Router();
const {
  sendOTP,
  verifyOTP,
  register,
  login,
  getMe,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  resetUserPassword
} = require('../controller/userController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/register', register);
router.post('/login', login);

// User protected routes - MUST come before parameterized routes to ensure correct matching
router.get('/me', protect, getMe);

// Admin routes - use adminAuth middleware (must come before regular user routes with parameters)
const { protectAdmin } = require('../middleware/adminAuth');
router.get('/', protectAdmin, getUsers);
router.put('/:id/admin-update', protectAdmin, updateUser); // Admin-specific update route (more specific, must come first)
router.put('/:id/reset-password', protectAdmin, resetUserPassword);
router.get('/:id', protectAdmin, getUser);
router.delete('/:id', protectAdmin, deleteUser);

// More user protected routes (with parameters)
router.put('/:id', protect, updateUser);
router.post('/:id/addresses', protect, addAddress);
router.put('/:id/addresses/:addressId', protect, updateAddress);
router.delete('/:id/addresses/:addressId', protect, deleteAddress);
router.put('/:id/addresses/:addressId/set-default', protect, setDefaultAddress);

module.exports = router;

