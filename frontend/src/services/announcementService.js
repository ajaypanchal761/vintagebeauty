import api from './api';
import adminApi from './adminApi';

const announcementService = {
  // Get all announcements (Admin only)
  getAnnouncements: async () => {
    try {
      const response = await adminApi.get('/announcements');
      return {
        success: true,
        data: response.data.data || { announcements: [], total: 0 }
      };
    } catch (error) {
      console.error('Get announcements error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to fetch announcements' };
    }
  },

  // Get single announcement (Admin only)
  getAnnouncement: async (id) => {
    try {
      const response = await adminApi.get(`/announcements/${id}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Get announcement error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to fetch announcement' };
    }
  },

  // Get announcement stats (Admin only)
  getAnnouncementStats: async () => {
    try {
      const response = await adminApi.get('/announcements/stats');
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Get announcement stats error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to fetch announcement stats' };
    }
  },

  // Create announcement (Admin only)
  createAnnouncement: async (announcementData) => {
    try {
      const response = await adminApi.post('/announcements', announcementData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Announcement created successfully'
      };
    } catch (error) {
      console.error('Create announcement error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to create announcement' };
    }
  },

  // Update announcement (Admin only)
  updateAnnouncement: async (id, announcementData) => {
    try {
      const response = await adminApi.put(`/announcements/${id}`, announcementData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Announcement updated successfully'
      };
    } catch (error) {
      console.error('Update announcement error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to update announcement' };
    }
  },

  // Delete announcement (Admin only)
  deleteAnnouncement: async (id) => {
    try {
      const response = await adminApi.delete(`/announcements/${id}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Announcement deleted successfully'
      };
    } catch (error) {
      console.error('Delete announcement error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to delete announcement' };
    }
  },

  // Toggle announcement status (Admin only)
  toggleAnnouncementStatus: async (id) => {
    try {
      const response = await adminApi.patch(`/announcements/${id}/toggle-status`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Announcement status updated successfully'
      };
    } catch (error) {
      console.error('Toggle announcement status error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to toggle announcement status' };
    }
  },

  // Get active announcements (Public)
  getActiveAnnouncements: async () => {
    try {
      const response = await api.get('/announcements/active');
      return {
        success: true,
        data: response.data.data || []
      };
    } catch (error) {
      console.error('Get active announcements error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to fetch active announcements' };
    }
  },

  // Increment views (Public)
  incrementViews: async (id) => {
    try {
      const response = await api.patch(`/announcements/${id}/view`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Increment views error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to increment views' };
    }
  },

  // Increment clicks (Public)
  incrementClicks: async (id) => {
    try {
      const response = await api.patch(`/announcements/${id}/click`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Increment clicks error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to increment clicks' };
    }
  }
};

export default announcementService;

