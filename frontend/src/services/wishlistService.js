import api from './api';

const wishlistService = {
  // Get user wishlist
  getWishlist: async () => {
    try {
      const response = await api.get('/wishlist');
      const wishlistData = response.data.data || {};
      
      // Backend returns wishlist with 'products' array (populated products)
      const products = wishlistData.products || [];
      
      return {
        success: true,
        data: wishlistData,
        items: products, // Map 'products' to 'items' for compatibility
        products: products
      };
    } catch (error) {
      console.error('Get wishlist error:', error);
      if (error.response?.status === 401) {
        // User not logged in, return empty wishlist
        return {
          success: true,
          data: { products: [] },
          items: [],
          products: []
        };
      }
      throw { success: false, message: error.response?.data?.message || error.message || 'Failed to fetch wishlist' };
    }
  },

  // Add to wishlist
  addToWishlist: async (productId) => {
    try {
      const response = await api.post('/wishlist', { productId });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Item added to wishlist'
      };
    } catch (error) {
      console.error('Add to wishlist error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to add item to wishlist' };
    }
  },

  // Remove from wishlist
  removeFromWishlist: async (productId) => {
    try {
      // Ensure productId is a string and not empty
      const productIdStr = String(productId || '').trim();
      
      if (!productIdStr) {
        throw { 
          success: false, 
          message: 'Product ID is required',
          response: { data: { success: false, message: 'Product ID is required' } }
        };
      }

      const response = await api.delete(`/wishlist/${productIdStr}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Item removed from wishlist'
      };
    } catch (error) {
      console.error('Remove from wishlist error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      if (error.message) {
        throw { success: false, message: error.message };
      }
      throw { success: false, message: 'Failed to remove item from wishlist' };
    }
  },

  // Clear wishlist
  clearWishlist: async () => {
    try {
      const response = await api.delete('/wishlist');
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Wishlist cleared'
      };
    } catch (error) {
      console.error('Clear wishlist error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to clear wishlist' };
    }
  }
};

export default wishlistService;

