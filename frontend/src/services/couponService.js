import api from './api';
import adminApi from './adminApi';

const couponService = {
  // Get all coupons (Admin only)
  getCoupons: async () => {
    try {
      const response = await adminApi.get('/coupons');
      return {
        success: true,
        data: response.data.data || []
      };
    } catch (error) {
      console.error('Get coupons error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to fetch coupons' };
    }
  },

  // Get single coupon (Admin only)
  getCoupon: async (id) => {
    try {
      const response = await adminApi.get(`/coupons/${id}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Get coupon error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to fetch coupon' };
    }
  },

  // Create coupon (Admin only)
  createCoupon: async (couponData) => {
    try {
      const response = await adminApi.post('/coupons', couponData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Coupon created successfully'
      };
    } catch (error) {
      console.error('Create coupon error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to create coupon' };
    }
  },

  // Update coupon (Admin only)
  updateCoupon: async (id, couponData) => {
    try {
      const response = await adminApi.put(`/coupons/${id}`, couponData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Coupon updated successfully'
      };
    } catch (error) {
      console.error('Update coupon error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to update coupon' };
    }
  },

  // Delete coupon (Admin only)
  deleteCoupon: async (id) => {
    try {
      const response = await adminApi.delete(`/coupons/${id}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Coupon deleted successfully'
      };
    } catch (error) {
      console.error('Delete coupon error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to delete coupon' };
    }
  },

  // Get active coupons (Public)
  getActiveCoupons: async () => {
    try {
      const response = await api.get('/coupons/active');
      return {
        success: true,
        data: response.data.data || []
      };
    } catch (error) {
      console.error('Get active coupons error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to fetch active coupons' };
    }
  },

  // Get coupon by code (Public)
  getCouponByCode: async (code) => {
    try {
      const response = await api.get(`/coupons/code/${code}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Get coupon by code error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to fetch coupon' };
    }
  }
};

export default couponService;

