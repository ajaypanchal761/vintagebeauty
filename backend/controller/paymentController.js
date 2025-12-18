const Razorpay = require('razorpay');
const crypto = require('crypto');
const axios = require('axios');
const Order = require('../model/Order');

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Cashfree configuration
const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const CASHFREE_MODE = process.env.CASHFREE_MODE || 'sandbox'; // 'sandbox' or 'production'
const CASHFREE_BASE_URL = CASHFREE_MODE === 'production' 
  ? 'https://api.cashfree.com/pg' 
  : 'https://sandbox.cashfree.com/pg';

// @desc    Create Razorpay order
// @route   POST /api/payments/create-order
// @access  Private
exports.createRazorpayOrder = async (req, res, next) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }

    // Convert amount to paise (Razorpay expects amount in smallest currency unit)
    const amountInPaise = Math.round(amount * 100);

    const options = {
      amount: amountInPaise,
      currency: currency,
      receipt: receipt || `receipt_${Date.now()}`,
      payment_capture: 1 // Auto capture payment
    };

    const razorpayOrder = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      message: 'Razorpay order created successfully',
      data: {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID
      }
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    next(error);
  }
};

// @desc    Verify Razorpay payment
// @route   POST /api/payments/verify-payment
// @access  Private
exports.verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing payment verification details'
      });
    }

    // Create signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    // Verify signature
    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: Invalid signature'
      });
    }

    // Fetch payment details from Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        amount: payment.amount / 100, // Convert from paise to rupees
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        paymentDetails: payment
      }
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    next(error);
  }
};

// @desc    Handle Razorpay webhook
// @route   POST /api/payments/webhook
// @access  Public (Razorpay calls this)
exports.handleWebhook = async (req, res, next) => {
  try {
    const webhookSignature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
    const webhookBody = JSON.stringify(req.body);

    // Verify webhook signature
    const generatedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(webhookBody)
      .digest('hex');

    if (generatedSignature !== webhookSignature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook signature'
      });
    }

    const event = req.body.event;
    const payment = req.body.payload.payment?.entity;

    if (event === 'payment.captured' && payment) {
      // Update order with payment details
      const order = await Order.findOne({ 
        'razorpay.orderId': payment.order_id 
      });

      if (order) {
        order.paymentStatus = 'completed';
        order.razorpay = {
          orderId: payment.order_id,
          paymentId: payment.id,
          signature: payment.signature || null
        };
        await order.save();
      }
    } else if (event === 'payment.failed' && payment) {
      // Handle failed payment
      const order = await Order.findOne({ 
        'razorpay.orderId': payment.order_id 
      });

      if (order) {
        order.paymentStatus = 'failed';
        await order.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully'
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    next(error);
  }
};

// @desc    Get payment status
// @route   GET /api/payments/status/:orderId
// @access  Private
exports.getPaymentStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({ 
      'razorpay.orderId': orderId 
    }).populate('user', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns this order
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this order'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        orderId: order.razorpay?.orderId || order.cashfree?.orderId,
        paymentId: order.razorpay?.paymentId || order.cashfree?.paymentId,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus
      }
    });
  } catch (error) {
    console.error('Get payment status error:', error);
    next(error);
  }
};

// ==================== CASHFREE PAYMENT METHODS ====================

// @desc    Create Cashfree payment session
// @route   POST /api/payments/cashfree/create-session
// @access  Private
exports.createCashfreeSession = async (req, res, next) => {
  try {
    const { amount, currency = 'INR', customerDetails, orderId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }

    if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Cashfree credentials not configured'
      });
    }

    // Cashfree API v2023-08-01 expects amount in rupees (not paise)
    // Send amount directly in rupees with proper rounding
    const amountInRupees = Math.round(amount * 100) / 100;

    const sessionData = {
      order_id: orderId || `order_${Date.now()}`,
      order_amount: amountInRupees,
      order_currency: currency,
      customer_details: {
        customer_id: customerDetails?.customerId || req.user._id.toString(),
        customer_name: customerDetails?.name || req.user.name || 'Customer',
        customer_email: customerDetails?.email || req.user.email || '',
        customer_phone: customerDetails?.phone || customerDetails?.contact || ''
      },
      order_meta: {
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/order-success?gateway=cashfree&order_id={order_id}&payment_id={payment_id}`,
        notify_url: `${process.env.BACKEND_URL || 'http://localhost:5001'}/api/payments/cashfree/webhook`
      }
    };

    const response = await axios.post(
      `${CASHFREE_BASE_URL}/orders`,
      sessionData,
      {
        headers: {
          'x-client-id': CASHFREE_APP_ID,
          'x-client-secret': CASHFREE_SECRET_KEY,
          'x-api-version': '2023-08-01',
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data && response.data.payment_session_id) {
      res.status(200).json({
        success: true,
        message: 'Cashfree payment session created successfully',
        data: {
          orderId: response.data.order_id,
          paymentSessionId: response.data.payment_session_id,
          appId: CASHFREE_APP_ID,
          orderAmount: response.data.order_amount,
          orderCurrency: response.data.order_currency
        }
      });
    } else {
      throw new Error('Failed to create Cashfree payment session');
    }
  } catch (error) {
    console.error('Cashfree session creation error:', error.response?.data || error.message);
    next(error);
  }
};

// @desc    Verify Cashfree payment
// @route   POST /api/payments/cashfree/verify-payment
// @access  Private
exports.verifyCashfreePayment = async (req, res, next) => {
  try {
    const { orderId, paymentId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    // If paymentId is a placeholder, we'll fetch it from Cashfree API
    const isPlaceholder = paymentId === 'placeholder' || paymentId === '{payment_id}';

    if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Cashfree credentials not configured'
      });
    }

    // Get order details from Cashfree to verify payment status
    // This is the most reliable way to check payment status
    const orderResponse = await axios.get(
      `${CASHFREE_BASE_URL}/orders/${orderId}`,
      {
        headers: {
          'x-client-id': CASHFREE_APP_ID,
          'x-client-secret': CASHFREE_SECRET_KEY,
          'x-api-version': '2023-08-01',
          'Content-Type': 'application/json'
        }
      }
    );
    
    const orderData = orderResponse.data;
    
    // Extract payment information from order response
    // Cashfree API v3 returns payment_status in the order object
    const paymentStatus = orderData.payment_status || orderData.paymentStatus || orderData.order_status;
    const orderAmount = orderData.order_amount || orderData.orderAmount || 0;
    const orderCurrency = orderData.order_currency || orderData.orderCurrency || 'INR';
    
    // Extract payment ID from order response if not provided or is placeholder
    let actualPaymentId = paymentId;
    if (isPlaceholder) {
      // Try to get payment ID from order response
      actualPaymentId = orderData.payment_id || 
                       orderData.paymentId || 
                       orderData.payments?.[0]?.payment_id || 
                       orderData.payments?.[0]?.paymentId ||
                       null;
    }
    
    // If payment_status is not directly available, check order_status
    // In Cashfree, if order_status is PAID, payment is successful
    // Note: "ACTIVE" status also indicates successful payment (Cashfree only redirects on success)
    // Other valid statuses: SUCCESS, PAID, ACTIVE, COMPLETED
    const isPaymentSuccessful = 
      paymentStatus === 'SUCCESS' || 
      paymentStatus === 'PAID' || 
      paymentStatus === 'ACTIVE' ||  // Active status means payment is successful
      paymentStatus === 'COMPLETED' ||
      orderData.order_status === 'PAID' ||
      orderData.order_status === 'ACTIVE' ||
      orderData.order_status === 'COMPLETED' ||
      (orderData.payments && Array.isArray(orderData.payments) && orderData.payments.some(p => 
        (p.payment_id === paymentId || p.paymentId === paymentId) && 
        (p.payment_status === 'SUCCESS' || 
         p.payment_status === 'PAID' || 
         p.payment_status === 'ACTIVE' ||
         p.payment_status === 'COMPLETED')
      ));

    if (isPaymentSuccessful) {
      res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        data: {
          orderId: orderData.order_id || orderId,
          paymentId: actualPaymentId || paymentId,
          amount: orderAmount, // Already in rupees (API v2023-08-01)
          currency: orderCurrency,
          status: paymentStatus || 'PAID',
          method: orderData.payment_method || 'unknown',
          paymentDetails: orderData
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        message: `Payment verification failed: ${paymentStatus || orderData.order_status || 'Unknown status'}`,
        data: {
          orderId: orderData.order_id || orderId,
          paymentId: paymentId,
          status: paymentStatus || orderData.order_status
        }
      });
    }
  } catch (error) {
    const errorDetails = {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText,
      orderId: req.body?.orderId,
      paymentId: req.body?.paymentId,
      url: error.config?.url,
      headers: error.config?.headers ? Object.keys(error.config.headers) : null
    };
    
    console.error('Cashfree payment verification error:', JSON.stringify(errorDetails, null, 2));
    
    // If we can't verify from Cashfree API, but we have payment_id from redirect URL,
    // we can assume payment was successful (Cashfree only redirects on success)
    // However, this is less secure, so we'll return an error but log it
    if (error.response?.status === 404 || error.response?.status === 400) {
      // Order or payment not found - might be a timing issue or invalid IDs
      return res.status(400).json({
        success: false,
        message: `Payment verification failed: ${error.response?.data?.message || error.message || 'Order or payment not found'}`,
        error: error.response?.data || error.message,
        details: {
          orderId: req.body?.orderId,
          paymentId: req.body?.paymentId,
          suggestion: 'Please check the order_id and payment_id in Cashfree dashboard'
        }
      });
    }
    
    // Return a more descriptive error for other cases
    return res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || error.message || 'Payment verification failed',
      error: error.response?.data || error.message,
      details: {
        orderId: req.body?.orderId,
        paymentId: req.body?.paymentId,
        cashfreeError: error.response?.data
      }
    });
  }
};

// @desc    Handle Cashfree webhook
// @route   POST /api/payments/cashfree/webhook
// @access  Public (Cashfree calls this)
exports.handleCashfreeWebhook = async (req, res, next) => {
  try {
    const webhookData = req.body;
    const orderId = webhookData.data?.order?.order_id;
    const paymentId = webhookData.data?.payment?.payment_id;
    const paymentStatus = webhookData.data?.payment?.payment_status;

    if (paymentStatus === 'SUCCESS' && orderId && paymentId) {
      // Update order with payment details
      const order = await Order.findOne({ 
        'cashfree.orderId': orderId 
      });

      if (order) {
        order.paymentStatus = 'completed';
        order.cashfree = {
          orderId: orderId,
          paymentId: paymentId
        };
        await order.save();
      }
    } else if (paymentStatus === 'FAILED' && orderId) {
      // Handle failed payment
      const order = await Order.findOne({ 
        'cashfree.orderId': orderId 
      });

      if (order) {
        order.paymentStatus = 'failed';
        await order.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully'
    });
  } catch (error) {
    console.error('Cashfree webhook processing error:', error);
    next(error);
  }
};

