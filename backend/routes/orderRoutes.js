const express = require('express');
const router = express.Router();
const {
  createOrder,
  getUserOrders,
  getOrder,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  handleCancellationRequest,
  processRefund,
  confirmCODReceipt,
  trackOrder
} = require('../controller/orderController');
const { protect } = require('../middleware/auth');
const { protectAdmin } = require('../middleware/adminAuth');

// Public route for order tracking
router.get('/track/:identifier', trackOrder);

// User routes (protected with protect middleware)
router.post('/', protect, createOrder);
router.get('/', protect, getUserOrders);
router.get('/:id', protect, getOrder);
router.put('/:id/cancel', protect, cancelOrder);

// Admin routes (protected with protectAdmin middleware)
router.get('/admin/all', protectAdmin, getAllOrders);
router.put('/:id/status', protectAdmin, updateOrderStatus);
router.put('/:id/cancellation', protectAdmin, handleCancellationRequest);
router.put('/:id/refund', protectAdmin, processRefund);
router.put('/:id/confirm-cod', protectAdmin, confirmCODReceipt);

module.exports = router;

