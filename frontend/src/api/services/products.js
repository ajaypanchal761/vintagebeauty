/**
 * Products API Service
 * All product-related API calls using centralized API client
 */

import { getUserClient, getAdminClient } from '../clients/apiClient';
import { ENDPOINTS } from '../config/endpoints';
import { transformResponse, extractData } from '../utils/responseTransformer';
import { formatError } from '../utils/errorHandler';

const userClient = getUserClient();
const adminClient = getAdminClient();

export const products = {
  /**
   * Get all products with filters
   */
  getAll: async (filters = {}) => {
    try {
      const params = {};
      
      if (filters.search) params.search = filters.search;
      if (filters.category) params.category = filters.category;
      if (filters.isFeatured !== undefined) params.isFeatured = filters.isFeatured;
      if (filters.isBestSeller !== undefined) params.isBestSeller = filters.isBestSeller;
      if (filters.isMostLoved !== undefined) params.isMostLoved = filters.isMostLoved;
      if (filters.inStock !== undefined) params.inStock = filters.inStock;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters.sort) params.sort = filters.sort;
      if (filters.page) params.page = filters.page;
      if (filters.limit) params.limit = filters.limit;

      const response = await userClient.get(ENDPOINTS.PRODUCTS.LIST, { params });
      const transformed = transformResponse(response);
      
      return {
        success: true,
        data: transformed.data || [],
        products: transformed.data || [],
        total: transformed.total || 0,
        page: transformed.page || 1,
        pages: transformed.pages || 1,
      };
    } catch (error) {
      throw formatError(error);
    }
  },

  /**
   * Get products by section (featured, bestsellers, most-loved)
   */
  getBySection: async (section) => {
    try {
      let endpoint = ENDPOINTS.PRODUCTS.LIST;
      
      if (section === 'featured') {
        endpoint = ENDPOINTS.PRODUCTS.FEATURED;
      } else if (section === 'bestsellers') {
        endpoint = ENDPOINTS.PRODUCTS.BESTSELLERS;
      } else if (section === 'mostloved' || section === 'most-loved') {
        endpoint = ENDPOINTS.PRODUCTS.MOST_LOVED;
      }
      
      const response = await userClient.get(endpoint);
      const transformed = transformResponse(response);
      
      return {
        success: true,
        data: transformed.data || [],
        products: transformed.data || [],
      };
    } catch (error) {
      throw formatError(error);
    }
  },

  /**
   * Get single product by ID
   */
  getById: async (id) => {
    try {
      const response = await userClient.get(ENDPOINTS.PRODUCTS.BY_ID(id));
      const transformed = transformResponse(response);
      
      return {
        success: true,
        data: transformed.data,
      };
    } catch (error) {
      throw formatError(error);
    }
  },

  /**
   * Get product by slug
   */
  getBySlug: async (slug) => {
    try {
      const response = await userClient.get(ENDPOINTS.PRODUCTS.BY_SLUG(slug));
      const transformed = transformResponse(response);
      
      return {
        success: true,
        data: transformed.data,
      };
    } catch (error) {
      throw formatError(error);
    }
  },

  /**
   * Get products by category
   */
  getByCategory: async (categorySlug) => {
    try {
      const response = await userClient.get(ENDPOINTS.PRODUCTS.BY_CATEGORY(categorySlug));
      const transformed = transformResponse(response);
      
      return {
        success: true,
        data: transformed.data || [],
        products: transformed.data || [],
      };
    } catch (error) {
      throw formatError(error);
    }
  },

  // ==================== ADMIN METHODS ====================

  /**
   * Create new product (Admin)
   */
  create: async (formData) => {
    try {
      const response = await adminClient.post(ENDPOINTS.PRODUCTS.CREATE, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      const transformed = transformResponse(response);
      
      return {
        success: true,
        data: transformed.data,
        message: transformed.message || 'Product created successfully'
      };
    } catch (error) {
      throw formatError(error);
    }
  },

  /**
   * Update product (Admin)
   */
  update: async (id, formData) => {
    try {
      const response = await adminClient.put(ENDPOINTS.PRODUCTS.UPDATE(id), formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      const transformed = transformResponse(response);
      
      return {
        success: true,
        data: transformed.data,
        message: transformed.message || 'Product updated successfully'
      };
    } catch (error) {
      throw formatError(error);
    }
  },

  /**
   * Delete product (Admin)
   */
  delete: async (id) => {
    try {
      const response = await adminClient.delete(ENDPOINTS.PRODUCTS.DELETE(id));
      const transformed = transformResponse(response);
      
      return {
        success: true,
        data: transformed.data,
        message: transformed.message || 'Product deleted successfully'
      };
    } catch (error) {
      throw formatError(error);
    }
  },

  /**
   * Update product sections (featured, bestseller, most loved) (Admin)
   */
  updateSections: async (id, sections) => {
    try {
      const formData = new FormData();
      Object.keys(sections).forEach(key => {
        formData.append(key, sections[key]);
      });

      const response = await adminClient.put(ENDPOINTS.PRODUCTS.UPDATE(id), formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      const transformed = transformResponse(response);
      
      return {
        success: true,
        data: transformed.data
      };
    } catch (error) {
      throw formatError(error);
    }
  },
};

export default products;
