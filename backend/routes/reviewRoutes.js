const express = require('express');
const router = express.Router();
const {
  createReview,
  getProductReviews,
  getUserReview,
  updateReview,
  deleteReview
} = require('../controller/reviewController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/product/:productId', getProductReviews);

// Protected routes (require authentication)
router.post('/', protect, createReview);
router.get('/product/:productId/user', protect, getUserReview);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;

