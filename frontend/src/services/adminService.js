import adminApi from './adminApi';

const adminService = {
  // Get current admin profile
  getMe: async () => {
    try {
      const response = await adminApi.get('/admin/me');
      return {
        success: true,
        data: response.data.data,
        valid: true,
        user: response.data.data
      };
    } catch (error) {
      console.error('Get admin profile error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to fetch admin profile' };
    }
  },

  // Update admin profile
  updateAdminProfile: async (profileData) => {
    try {
      const response = await adminApi.put('/admin/me', profileData);
      return {
        success: true,
        data: {
          user: response.data.data,
          message: response.data.message || 'Admin profile updated successfully'
        }
      };
    } catch (error) {
      console.error('Update admin profile error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to update admin profile' };
    }
  },

  // Verify token (alias for getMe)
  verifyToken: async () => {
    try {
      return await adminService.getMe();
    } catch (error) {
      return {
        valid: false,
        success: false
      };
    }
  },

  // Update admin credentials (alias for updateAdminProfile)
  updateAdminCredentials: async (credentialsData) => {
    try {
      // Map frontend fields to backend fields
      const profileData = {
        username: credentialsData.username,
        email: credentialsData.email,
        currentPassword: credentialsData.currentPassword,
        newPassword: credentialsData.newPassword
      };

      return await adminService.updateAdminProfile(profileData);
    } catch (error) {
      console.error('Update admin credentials error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to update admin credentials' };
    }
  }
};

export default adminService;

