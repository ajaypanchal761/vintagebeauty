import api from './api';

const paymentService = {
  // Create Razorpay order
  createRazorpayOrder: async (amount, receipt) => {
    try {
      const response = await api.post('/payments/create-order', {
        amount,
        currency: 'INR',
        receipt: receipt || `receipt_${Date.now()}`
      });
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Create Razorpay order error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to create payment order' };
    }
  },

  // Verify payment
  verifyPayment: async (razorpay_order_id, razorpay_payment_id, razorpay_signature) => {
    try {
      const response = await api.post('/payments/verify-payment', {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      });
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Verify payment error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Payment verification failed' };
    }
  },

  // Get payment status
  getPaymentStatus: async (orderId) => {
    try {
      const response = await api.get(`/payments/status/${orderId}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Get payment status error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to get payment status' };
    }
  },

  // ==================== CASHFREE METHODS ====================

  // Create Cashfree payment session
  createCashfreeSession: async (amount, orderId, customerDetails) => {
    try {
      const response = await api.post('/payments/cashfree/create-session', {
        amount,
        currency: 'INR',
        orderId: orderId || `order_${Date.now()}`,
        customerDetails
      });
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Create Cashfree session error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to create Cashfree payment session' };
    }
  },

  // Verify Cashfree payment
  verifyCashfreePayment: async (orderId, paymentId) => {
    try {
      const response = await api.post('/payments/cashfree/verify-payment', {
        orderId,
        paymentId
      });
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Verify Cashfree payment error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Payment verification failed' };
    }
  }
};

export default paymentService;

