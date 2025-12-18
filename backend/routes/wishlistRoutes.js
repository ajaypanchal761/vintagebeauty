const express = require('express');
const router = express.Router();
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  getAllWishlists,
  getWishlistAnalytics
} = require('../controller/wishlistController');
const { protect } = require('../middleware/auth');
const { protectAdmin } = require('../middleware/adminAuth');

// User routes (protected with protect middleware)
router.get('/', protect, getWishlist);
router.post('/', protect, addToWishlist);
// Parameterized route comes first, then base route
router.delete('/:productId', protect, removeFromWishlist);
router.delete('/', protect, clearWishlist);

// Admin routes (protected with protectAdmin middleware)
router.get('/admin/all', protectAdmin, getAllWishlists);
router.get('/admin/analytics', protectAdmin, getWishlistAnalytics);

module.exports = router;

