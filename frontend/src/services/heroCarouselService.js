import api from './api';
import adminApi from './adminApi';

const heroCarouselService = {
  // Get all carousel items (public - for frontend display)
  getCarouselItems: async (activeOnly = false) => {
    try {
      const url = activeOnly ? '/hero-carousel?active=true' : '/hero-carousel';
      const response = await api.get(url);
      return {
        success: true,
        data: response.data.data || []
      };
    } catch (error) {
      console.error('Get carousel items error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to fetch carousel items' };
    }
  },

  // Get single carousel item (admin only)
  getCarouselItem: async (id) => {
    try {
      const response = await adminApi.get(`/hero-carousel/${id}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Get carousel item error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to fetch carousel item' };
    }
  },

  // Create carousel item (admin only)
  createCarouselItem: async (formData) => {
    try {
      const response = await adminApi.post('/hero-carousel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Carousel item created successfully'
      };
    } catch (error) {
      console.error('Create carousel item error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to create carousel item' };
    }
  },

  // Update carousel item (admin only)
  updateCarouselItem: async (id, formData) => {
    try {
      const response = await adminApi.put(`/hero-carousel/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Carousel item updated successfully'
      };
    } catch (error) {
      console.error('Update carousel item error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to update carousel item' };
    }
  },

  // Delete carousel item (admin only)
  deleteCarouselItem: async (id) => {
    try {
      const response = await adminApi.delete(`/hero-carousel/${id}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Carousel item deleted successfully'
      };
    } catch (error) {
      console.error('Delete carousel item error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to delete carousel item' };
    }
  },

  // Toggle active status (admin only)
  toggleCarouselActive: async (id) => {
    try {
      const response = await adminApi.put(`/hero-carousel/${id}/toggle-active`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Carousel item status updated successfully'
      };
    } catch (error) {
      console.error('Toggle carousel active error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to toggle carousel item status' };
    }
  },

  // Update carousel order (admin only)
  updateCarouselOrder: async (items) => {
    try {
      const response = await adminApi.put('/hero-carousel/update-order', { items });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Carousel order updated successfully'
      };
    } catch (error) {
      console.error('Update carousel order error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to update carousel order' };
    }
  }
};

export default heroCarouselService;

