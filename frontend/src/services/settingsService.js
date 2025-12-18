import adminApi from './adminApi';

const settingsService = {
  // Get all settings
  getSettings: async () => {
    try {
      const response = await adminApi.get('/admin/settings');
      return {
        success: true,
        data: {
          settings: response.data.data?.settings || []
        }
      };
    } catch (error) {
      console.error('Get settings error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to fetch settings' };
    }
  },

  // Get single setting by key
  getSetting: async (key) => {
    try {
      const response = await adminApi.get(`/admin/settings/${key}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Get setting error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to fetch setting' };
    }
  },

  // Update setting
  updateSetting: async (key, settingData) => {
    try {
      const response = await adminApi.put(`/admin/settings/${key}`, {
        value: settingData.value,
        description: settingData.description,
        type: settingData.type
      });
      return {
        success: true,
        data: {
          setting: response.data.data,
          message: response.data.message || 'Setting updated successfully'
        }
      };
    } catch (error) {
      console.error('Update setting error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to update setting' };
    }
  },

  // Create setting
  createSetting: async (settingData) => {
    try {
      const response = await adminApi.post('/admin/settings', settingData);
      return {
        success: true,
        data: {
          setting: response.data.data,
          message: response.data.message || 'Setting created successfully'
        }
      };
    } catch (error) {
      console.error('Create setting error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to create setting' };
    }
  },

  // Delete setting
  deleteSetting: async (key) => {
    try {
      const response = await adminApi.delete(`/admin/settings/${key}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Setting deleted successfully'
      };
    } catch (error) {
      console.error('Delete setting error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to delete setting' };
    }
  }
};

export default settingsService;

