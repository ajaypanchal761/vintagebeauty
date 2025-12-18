import api from './api';

const cartService = {
  // Get user cart
  getCart: async () => {
    try {
      const response = await api.get('/cart');
      return {
        success: true,
        data: response.data.data || { items: [] },
        items: response.data.data?.items || []
      };
    } catch (error) {
      // Handle 401 (Unauthorized) silently - user not logged in or token expired
      if (error.response?.status === 401 || error.status === 401) {
        // User not logged in, return empty cart without logging error
        return {
          success: true,
          data: { items: [] },
          items: []
        };
      }
      // Only log non-401 errors
      console.error('Get cart error:', error);
      throw { success: false, message: error.response?.data?.message || error.message || 'Failed to fetch cart' };
    }
  },

  // Add to cart
  addToCart: async (productId, quantity = 1, size = null, comboDeal = null) => {
    try {
      const requestBody = {
        productId,
        quantity,
        size
      };
      
      // Add combo deal info if provided
      if (comboDeal) {
        requestBody.comboDeal = {
          dealId: comboDeal.dealId,
          dealPrice: comboDeal.dealPrice,
          requiredItems: comboDeal.requiredItems
        };
      }
      
      const response = await api.post('/cart', requestBody);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Item added to cart'
      };
    } catch (error) {
      // Handle 401 (Unauthorized) - user not logged in or token expired
      if (error.response?.status === 401) {
        throw {
          success: false,
          message: 'Please login to add items to cart',
          isUnauthorized: true
        };
      }
      console.error('Add to cart error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to add item to cart' };
    }
  },

  // Update cart item
  updateCartItem: async (itemId, quantity, size = null, selectedPrice = null) => {
    try {
      const response = await api.put(`/cart/${itemId}`, {
        quantity,
        size,
        selectedPrice
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Cart item updated'
      };
    } catch (error) {
      // Handle 401 (Unauthorized)
      if (error.response?.status === 401) {
        throw {
          success: false,
          message: 'Please login to update cart',
          isUnauthorized: true
        };
      }
      console.error('Update cart item error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to update cart item' };
    }
  },

  // Remove from cart
  removeFromCart: async (itemId) => {
    try {
      const response = await api.delete(`/cart/${itemId}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Item removed from cart'
      };
    } catch (error) {
      // Handle 401 (Unauthorized)
      if (error.response?.status === 401) {
        throw {
          success: false,
          message: 'Please login to remove items from cart',
          isUnauthorized: true
        };
      }
      console.error('Remove from cart error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to remove item from cart' };
    }
  },

  // Clear cart
  clearCart: async () => {
    try {
      const response = await api.delete('/cart');
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Cart cleared'
      };
    } catch (error) {
      // Handle 401 (Unauthorized)
      if (error.response?.status === 401) {
        throw {
          success: false,
          message: 'Please login to clear cart',
          isUnauthorized: true
        };
      }
      console.error('Clear cart error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to clear cart' };
    }
  },

  // Apply coupon
  applyCoupon: async (code) => {
    try {
      const response = await api.post('/cart/coupon', { code });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Coupon applied'
      };
    } catch (error) {
      console.error('Apply coupon error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to apply coupon' };
    }
  },

  // Remove coupon
  removeCoupon: async () => {
    try {
      const response = await api.delete('/cart/coupon');
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Coupon removed'
      };
    } catch (error) {
      console.error('Remove coupon error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to remove coupon' };
    }
  }
};

export default cartService;

