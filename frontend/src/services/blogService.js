import api from './api';
import adminApi from './adminApi';

const blogService = {
  // Get all blogs (Admin only)
  getBlogs: async () => {
    try {
      const response = await adminApi.get('/blogs');
      return {
        success: true,
        data: response.data.data || { blogs: [] }
      };
    } catch (error) {
      console.error('Get blogs error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to fetch blogs' };
    }
  },

  // Get published blogs (Public)
  getPublishedBlogs: async () => {
    try {
      const response = await api.get('/blogs/published');
      return {
        success: true,
        data: response.data.data || { blogs: [] }
      };
    } catch (error) {
      console.error('Get published blogs error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to fetch published blogs' };
    }
  },

  // Get single blog by ID (Admin only)
  getBlog: async (id) => {
    try {
      const response = await adminApi.get(`/blogs/${id}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Get blog error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to fetch blog' };
    }
  },

  // Get single blog by slug (Public)
  getBlogBySlug: async (slug) => {
    try {
      const response = await api.get(`/blogs/slug/${slug}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Get blog by slug error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to fetch blog' };
    }
  },

  // Get blog statistics (Admin only)
  getStats: async () => {
    try {
      const response = await adminApi.get('/blogs/stats');
      return {
        success: true,
        data: response.data.data || { stats: { total: 0, published: 0, draft: 0, totalViews: 0 } }
      };
    } catch (error) {
      console.error('Get blog stats error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to fetch blog stats' };
    }
  },

  // Create blog (Admin only)
  createBlog: async (formData) => {
    try {
      const response = await adminApi.post('/blogs', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Blog created successfully'
      };
    } catch (error) {
      console.error('Create blog error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to create blog' };
    }
  },

  // Update blog (Admin only)
  updateBlog: async (id, formData) => {
    try {
      const response = await adminApi.put(`/blogs/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Blog updated successfully'
      };
    } catch (error) {
      console.error('Update blog error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to update blog' };
    }
  },

  // Delete blog (Admin only)
  deleteBlog: async (id) => {
    try {
      const response = await adminApi.delete(`/blogs/${id}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Blog deleted successfully'
      };
    } catch (error) {
      console.error('Delete blog error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to delete blog' };
    }
  },

  // Toggle blog status (Admin only)
  toggleBlogStatus: async (id) => {
    try {
      const response = await adminApi.patch(`/blogs/${id}/toggle-status`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Blog status updated successfully'
      };
    } catch (error) {
      console.error('Toggle blog status error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to toggle blog status' };
    }
  }
};

export default blogService;

