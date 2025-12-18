import api from './api';
import adminApi from './adminApi';

const productService = {
  // Get all products with filters
  getProducts: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category', filters.category);
      if (filters.isFeatured !== undefined) params.append('isFeatured', filters.isFeatured);
      if (filters.isBestSeller !== undefined) params.append('isBestSeller', filters.isBestSeller);
      if (filters.isMostLoved !== undefined) params.append('isMostLoved', filters.isMostLoved);
      if (filters.inStock !== undefined) params.append('inStock', filters.inStock);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.sort) params.append('sort', filters.sort);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);

      const queryString = params.toString();
      const url = `/products${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get(url);
      return {
        success: true,
        data: response.data.data || [],
        products: response.data.data || [],
        total: response.data.total || 0,
        page: response.data.page || 1,
        pages: response.data.pages || 1
      };
    } catch (error) {
      console.error('Get products error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to fetch products' };
    }
  },

  // Get products by section (featured, bestsellers, most-loved)
  getProductsBySection: async (section) => {
    try {
      let endpoint = '/products';
      
      if (section === 'featured') {
        endpoint = '/products/featured';
      } else if (section === 'bestsellers') {
        endpoint = '/products/bestsellers';
      } else if (section === 'mostloved' || section === 'most-loved') {
        endpoint = '/products/most-loved';
      }
      
      const response = await api.get(endpoint);
      return {
        success: true,
        data: response.data.data || [],
        products: response.data.data || []
      };
    } catch (error) {
      console.error('Get products by section error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to fetch products' };
    }
  },

  // Get single product by ID
  getProduct: async (id) => {
    try {
      const response = await api.get(`/products/${id}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Get product error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to fetch product' };
    }
  },

  // Create new product (Admin)
  createProduct: async (formData) => {
    try {
      const response = await adminApi.post('/products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Product created successfully'
      };
    } catch (error) {
      console.error('Create product error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to create product' };
    }
  },

  // Update product (Admin)
  updateProduct: async (id, formData) => {
    try {
      const response = await adminApi.put(`/products/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Product updated successfully'
      };
    } catch (error) {
      console.error('Update product error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to update product' };
    }
  },

  // Delete product (Admin)
  deleteProduct: async (id) => {
    try {
      const response = await adminApi.delete(`/products/${id}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Product deleted successfully'
      };
    } catch (error) {
      console.error('Delete product error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to delete product' };
    }
  },

  // Update product sections (featured, bestseller, most loved) (Admin)
  updateProductSections: async (id, sections) => {
    try {
      // Create form data with section updates
      const formData = new FormData();
      Object.keys(sections).forEach(key => {
        formData.append(key, sections[key]);
      });

      const response = await adminApi.put(`/products/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Update product sections error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to update product sections' };
    }
  }
};

export default productService;

