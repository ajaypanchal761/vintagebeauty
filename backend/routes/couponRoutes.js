const express = require('express');
const router = express.Router();
const {
  getCoupons,
  getActiveCoupons,
  getCoupon,
  getCouponByCode,
  createCoupon,
  updateCoupon,
  deleteCoupon
} = require('../controller/couponController');
const { protectAdmin } = require('../middleware/adminAuth');

// Public routes
router.get('/active', getActiveCoupons);
router.get('/code/:code', getCouponByCode);

// Admin routes - use adminAuth middleware
router.get('/', protectAdmin, getCoupons);
router.get('/:id', protectAdmin, getCoupon);
router.post('/', protectAdmin, createCoupon);
router.put('/:id', protectAdmin, updateCoupon);
router.delete('/:id', protectAdmin, deleteCoupon);

module.exports = router;

