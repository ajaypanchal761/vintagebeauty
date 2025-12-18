import api from './api';

const reviewService = {
  // Create a new review
  createReview: async (productId, rating, comment = '') => {
    try {
      const response = await api.post('/reviews', {
        productId,
        rating,
        comment
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Review submitted successfully'
      };
    } catch (error) {
      console.error('Create review error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to submit review' };
    }
  },

  // Get reviews for a product
  getProductReviews: async (productId, page = 1, limit = 10) => {
    try {
      const response = await api.get(`/reviews/product/${productId}?page=${page}&limit=${limit}`);
      return {
        success: true,
        reviews: response.data.data || [],
        total: response.data.total || 0,
        page: response.data.page || 1,
        pages: response.data.pages || 1
      };
    } catch (error) {
      console.error('Get product reviews error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to fetch reviews' };
    }
  },

  // Get user's review for a product
  getUserReview: async (productId) => {
    try {
      const response = await api.get(`/reviews/product/${productId}/user`);
      return {
        success: true,
        data: response.data.data,
        hasReview: !!response.data.data
      };
    } catch (error) {
      // Handle 401 (Unauthorized) gracefully - expected when user is not logged in or token expired
      if (error.response?.status === 401 || error.status === 401) {
        return {
          success: false,
          data: null,
          hasReview: false,
          isUnauthorized: true
        };
      }
      
      // Log and throw other errors
      console.error('Get user review error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to fetch review' };
    }
  },

  // Update a review
  updateReview: async (reviewId, rating, comment = '') => {
    try {
      const response = await api.put(`/reviews/${reviewId}`, {
        rating,
        comment
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Review updated successfully'
      };
    } catch (error) {
      console.error('Update review error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to update review' };
    }
  },

  // Delete a review
  deleteReview: async (reviewId) => {
    try {
      const response = await api.delete(`/reviews/${reviewId}`);
      return {
        success: true,
        message: response.data.message || 'Review deleted successfully'
      };
    } catch (error) {
      console.error('Delete review error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to delete review' };
    }
  }
};

export default reviewService;

