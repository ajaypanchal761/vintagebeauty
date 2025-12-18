import adminApi from './adminApi';
import api from './api';

const orderService = {
  // Create new order
  createOrder: async (orderData) => {
    try {
      const response = await api.post('/orders', orderData);
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error) {
      console.error('Create order error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to create order' };
    }
  },

  // Get user orders
  getUserOrders: async () => {
    try {
      const response = await api.get('/orders');
      return {
        success: true,
        data: response.data.data || []
      };
    } catch (error) {
      console.error('Get user orders error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to fetch orders' };
    }
  },

  // Get single order by ID (for user)
  getUserOrderById: async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error) {
      console.error('Get order error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to fetch order' };
    }
  },

  // Cancel order (for user)
  cancelOrder: async (orderId, reason) => {
    try {
      const response = await api.put(`/orders/${orderId}/cancel`, { reason });
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error) {
      console.error('Cancel order error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to cancel order' };
    }
  },

  // Get all orders (Admin only)
  getAllOrders: async () => {
    try {
      const response = await adminApi.get('/orders/admin/all');
      return {
        success: true,
        data: {
          orders: response.data.data || response.data || []
        }
      };
    } catch (error) {
      console.error('Get orders error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to fetch orders' };
    }
  },

  // Get single order by ID
  getOrderById: async (orderId) => {
    try {
      const response = await adminApi.get(`/orders/${orderId}`);
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error) {
      console.error('Get order error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to fetch order' };
    }
  },

  // Update order status (Admin only)
  updateOrderStatus: async (orderId, newStatus) => {
    try {
      const response = await adminApi.put(`/orders/${orderId}/status`, {
        orderStatus: newStatus
      });
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error) {
      console.error('Update order status error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to update order status' };
    }
  },

  // Handle cancellation request (Admin only)
  handleCancellationRequest: async (orderId, action, reasonForRejection) => {
    try {
      const response = await adminApi.put(`/orders/${orderId}/cancellation`, {
        action,
        reasonForRejection
      });
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error) {
      console.error('Handle cancellation request error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to handle cancellation request' };
    }
  },

  // Process refund (Admin only)
  processRefund: async (orderId) => {
    try {
      const response = await adminApi.put(`/orders/${orderId}/refund`, {});
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error) {
      console.error('Process refund error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to process refund' };
    }
  },

  // Confirm COD receipt (Admin only)
  confirmCODReceipt: async (orderId, confirmedAmount) => {
    try {
      const response = await adminApi.put(`/orders/${orderId}/confirm-cod`, {
        confirmedAmount
      });
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error) {
      console.error('Confirm COD receipt error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to confirm COD receipt' };
    }
  },

  // Track order by order number or tracking number (Public)
  trackOrder: async (identifier, phone) => {
    try {
      let url = `/orders/track/${identifier}`;
      if (phone) {
        url += `?phone=${encodeURIComponent(phone)}`;
      }
      const response = await api.get(url);
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error) {
      console.error('Track order error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to track order' };
    }
  }
};

export default orderService;

