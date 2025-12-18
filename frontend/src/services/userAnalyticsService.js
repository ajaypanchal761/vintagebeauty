import api from './api';
import adminApi from './adminApi';

const userAnalyticsService = {
  // Get user analytics (Admin only)
  getUserAnalytics: async (period = 'monthly') => {
    try {
      const response = await adminApi.get(`/user-analytics?period=${period}`);
      return {
        success: true,
        data: response.data.data || { analytics: {} }
      };
    } catch (error) {
      console.error('Get user analytics error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to fetch user analytics' };
    }
  },

  // Get user details by type (Admin only)
  getUserDetails: async (type = 'all', period = 'monthly') => {
    try {
      const response = await adminApi.get(`/user-analytics/users/${type}?period=${period}`);
      return {
        success: true,
        data: response.data.data || { users: { registered: [], anonymous: [] } }
      };
    } catch (error) {
      console.error('Get user details error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to fetch user details' };
    }
  },

  // Track user activity (Public)
  trackActivity: async (activityData) => {
    try {
      const response = await api.post('/user-analytics/track', activityData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Activity tracked successfully'
      };
    } catch (error) {
      console.error('Track activity error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to track activity' };
    }
  }
};

export default userAnalyticsService;

