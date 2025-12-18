import api from './api';
import adminApi from './adminApi';

const policyService = {
  // Get policy by type (Public)
  getPolicyByType: async (type) => {
    try {
      const response = await api.get(`/policies/type/${type}`);
      
      // Backend now returns 200 with success: false if policy doesn't exist
      // This is better than 404 for handling empty states
      if (response.data && response.data.success && response.data.data) {
        return {
          success: true,
          data: response.data.data
        };
      }
      
      // Policy doesn't exist - return empty state
      return {
        success: false,
        data: null,
        message: response.data?.message || 'Policy not found'
      };
    } catch (error) {
      console.error('Get policy by type error:', error);
      
      // Handle 404 - route not found or policy doesn't exist
      if (error.response?.status === 404) {
        return {
          success: false,
          data: null,
          message: 'Policy not found'
        };
      }
      
      // Handle 400 - invalid policy type
      if (error.response?.status === 400) {
        return {
          success: false,
          data: null,
          message: error.response.data?.message || 'Invalid policy type'
        };
      }
      
      // For other errors, log but return empty state
      if (error.response?.data) {
        console.error('Policy API error:', error.response.data);
        return {
          success: false,
          data: null,
          message: error.response.data.message || 'Failed to fetch policy'
        };
      }
      
      // Network or other errors
      return {
        success: false,
        data: null,
        message: error.message || 'Failed to fetch policy'
      };
    }
  },

  // Get all policies (Admin only)
  getPolicies: async () => {
    try {
      const response = await adminApi.get('/policies');
      return {
        success: true,
        data: response.data.data || []
      };
    } catch (error) {
      console.error('Get policies error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to fetch policies' };
    }
  },

  // Get single policy (Admin only)
  getPolicy: async (id) => {
    try {
      const response = await adminApi.get(`/policies/${id}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Get policy error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to fetch policy' };
    }
  },

  // Create or update policy (Admin only)
  createOrUpdatePolicy: async (policyData) => {
    try {
      const response = await adminApi.post('/policies', policyData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Policy saved successfully'
      };
    } catch (error) {
      console.error('Create/update policy error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to save policy' };
    }
  },

  // Update policy (Admin only)
  updatePolicy: async (id, policyData) => {
    try {
      const response = await adminApi.put(`/policies/${id}`, policyData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Policy updated successfully'
      };
    } catch (error) {
      console.error('Update policy error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to update policy' };
    }
  },

  // Delete policy (Admin only)
  deletePolicy: async (id) => {
    try {
      const response = await adminApi.delete(`/policies/${id}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Policy deleted successfully'
      };
    } catch (error) {
      console.error('Delete policy error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to delete policy' };
    }
  }
};

export default policyService;

