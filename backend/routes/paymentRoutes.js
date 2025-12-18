const express = require('express');
const router = express.Router();
const {
  createRazorpayOrder,
  verifyPayment,
  handleWebhook,
  getPaymentStatus,
  createCashfreeSession,
  verifyCashfreePayment,
  handleCashfreeWebhook
} = require('../controller/paymentController');
const { protect } = require('../middleware/auth');

// Razorpay routes
router.post('/create-order', protect, createRazorpayOrder);
router.post('/verify-payment', protect, verifyPayment);
router.post('/webhook', handleWebhook);

// Cashfree routes
router.post('/cashfree/create-session', protect, createCashfreeSession);
router.post('/cashfree/verify-payment', protect, verifyCashfreePayment);
router.post('/cashfree/webhook', handleCashfreeWebhook);

// Get payment status (works for both gateways)
router.get('/status/:orderId', protect, getPaymentStatus);

module.exports = router;

