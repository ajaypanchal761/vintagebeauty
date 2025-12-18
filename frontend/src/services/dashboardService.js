import adminApi from './adminApi';

const dashboardService = {
  // Get dashboard statistics
  getStats: async () => {
    try {
      const response = await adminApi.get('/dashboard/stats');
      return {
        success: true,
        data: {
          stats: response.data.data
        }
      };
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to fetch dashboard stats' };
    }
  },

  // Get sales analytics
  getSalesAnalytics: async (period = 'monthly') => {
    try {
      const response = await adminApi.get(`/dashboard/sales-analytics?period=${period}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Get sales analytics error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to fetch sales analytics' };
    }
  },

  // Get stock summary
  getStockSummary: async () => {
    try {
      const response = await adminApi.get('/dashboard/stock-summary');
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Get stock summary error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to fetch stock summary' };
    }
  },

  // Get revenue analytics
  getRevenueAnalytics: async (period = 'monthly') => {
    try {
      const response = await adminApi.get(`/dashboard/revenue-analytics?period=${period}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Get revenue analytics error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to fetch revenue analytics' };
    }
  }
};

export default dashboardService;

