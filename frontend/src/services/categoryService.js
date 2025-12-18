import api from './api';
import adminApi from './adminApi';

const categoryService = {
  // Get all categories
  getCategories: async () => {
    try {
      const response = await api.get('/categories');
      return {
        success: true,
        data: {
          categories: response.data.data || []
        },
        categories: response.data.data || []
      };
    } catch (error) {
      console.error('Get categories error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to fetch categories' };
    }
  },

  // Get single category by ID
  getCategory: async (id) => {
    try {
      const response = await api.get(`/categories/${id}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Get category error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to fetch category' };
    }
  },

  // Get category by slug
  getCategoryBySlug: async (slug) => {
    try {
      const response = await api.get(`/categories/slug/${slug}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Get category by slug error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to fetch category' };
    }
  },

  // Create new category (Admin)
  createCategory: async (formData) => {
    try {
      const response = await adminApi.post('/categories', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Category created successfully'
      };
    } catch (error) {
      console.error('Create category error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to create category' };
    }
  },

  // Update category (Admin)
  updateCategory: async (id, formData) => {
    try {
      const response = await adminApi.put(`/categories/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Category updated successfully'
      };
    } catch (error) {
      console.error('Update category error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to update category' };
    }
  },

  // Delete category (Admin)
  deleteCategory: async (id) => {
    try {
      const response = await adminApi.delete(`/categories/${id}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Category deleted successfully'
      };
    } catch (error) {
      console.error('Delete category error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to delete category' };
    }
  }
};

export default categoryService;

