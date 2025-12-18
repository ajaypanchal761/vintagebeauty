import adminApi from './adminApi';
import api from './api';

const userService = {
  // Get all users (Admin only)
  getAllUsers: async () => {
    try {
      const response = await adminApi.get('/users');
      return {
        success: true,
        data: {
          users: response.data.data || []
        },
        users: response.data.data || []
      };
    } catch (error) {
      console.error('Get users error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to fetch users' };
    }
  },

  // Get single user by ID (Admin only)
  getUser: async (id) => {
    try {
      const response = await adminApi.get(`/users/${id}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Get user error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to fetch user' };
    }
  },

  // Update user (Admin can update any user)
  updateUser: async (id, userData) => {
    try {
      const response = await adminApi.put(`/users/${id}/admin-update`, userData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'User updated successfully'
      };
    } catch (error) {
      console.error('Update user error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to update user' };
    }
  },

  // Delete user (Admin only)
  deleteUser: async (id) => {
    try {
      const response = await adminApi.delete(`/users/${id}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'User deleted successfully'
      };
    } catch (error) {
      console.error('Delete user error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to delete user' };
    }
  },

  // Reset user password (Admin only)
  resetUserPassword: async (userId, passwordData) => {
    try {
      const response = await adminApi.put(`/users/${userId}/reset-password`, passwordData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Password reset successfully'
      };
    } catch (error) {
      console.error('Reset password error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to reset password' };
    }
  },

  // Get current user profile
  getCurrentUser: async () => {
    try {
      const response = await api.get('/users/me');
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      // Don't suppress errors - let real errors show for debugging
      console.error('Get current user error:', error);
      
      // Log detailed error information for debugging
      if (import.meta.env.DEV) {
        console.error('getCurrentUser error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          url: error.config?.url
        });
      }
      
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to fetch user profile' };
    }
  },

  // Get addresses for current user
  getAddresses: async () => {
    try {
      const response = await api.get('/users/me');
      return response.data.data?.addresses || [];
    } catch (error) {
      // Don't suppress errors - let real errors show for debugging
      console.error('Get addresses error:', error);
      
      // Log detailed error information for debugging
      if (import.meta.env.DEV) {
        console.error('getAddresses error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          url: error.config?.url
        });
      }
      
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to fetch addresses' };
    }
  },

  // Update user profile (alias for updateUser)
  updateProfile: async (userId, profileData) => {
    try {
      const response = await api.put(`/users/${userId}`, profileData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Profile updated successfully'
      };
    } catch (error) {
      console.error('Update profile error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to update profile' };
    }
  },

  // Add address to user
  addAddress: async (userId, addressData) => {
    try {
      const response = await api.post(`/users/${userId}/addresses`, addressData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Address added successfully'
      };
    } catch (error) {
      console.error('Add address error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to add address' };
    }
  },

  // Update address
  updateAddress: async (userId, addressId, addressData) => {
    try {
      const response = await api.put(`/users/${userId}/addresses/${addressId}`, addressData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Address updated successfully'
      };
    } catch (error) {
      console.error('Update address error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to update address' };
    }
  },

  // Delete address
  deleteAddress: async (userId, addressId) => {
    try {
      const response = await api.delete(`/users/${userId}/addresses/${addressId}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Address deleted successfully'
      };
    } catch (error) {
      console.error('Delete address error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to delete address' };
    }
  },

  // Set default address
  setDefaultAddress: async (userId, addressId) => {
    try {
      const response = await api.put(`/users/${userId}/addresses/${addressId}/set-default`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Default address updated successfully'
      };
    } catch (error) {
      console.error('Set default address error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to set default address' };
    }
  }
};

export default userService;
