/**
 * Reviews API Service
 * All review-related API calls using centralized API client
 */

import { getUserClient } from '../clients/apiClient';
import { ENDPOINTS } from '../config/endpoints';
import { transformResponse } from '../utils/responseTransformer';
import { formatError } from '../utils/errorHandler';

const userClient = getUserClient();

export const reviews = {
  /**
   * Get reviews for a product
   */
  getProductReviews: async (productId, page = 1, limit = 50) => {
    try {
      const response = await userClient.get(ENDPOINTS.REVIEWS.BY_PRODUCT(productId), {
        params: { page, limit }
      });
      const transformed = transformResponse(response);
      
      return {
        success: true,
        reviews: transformed.data || [],
        data: transformed.data || [],
        total: transformed.total || 0,
        page: transformed.page || page,
        pages: transformed.pages || 1,
      };
    } catch (error) {
      throw formatError(error);
    }
  },

  /**
   * Get user's review for a product
   */
  getUserReview: async (productId) => {
    try {
      const response = await userClient.get(ENDPOINTS.REVIEWS.USER_REVIEW(productId));
      const transformed = transformResponse(response);
      
      return {
        success: true,
        data: transformed.data,
        hasReview: !!transformed.data,
      };
    } catch (error) {
      // Handle 401 (Unauthorized) gracefully
      if (error.response?.status === 401 || error.status === 401) {
        return {
          success: false,
          data: null,
          hasReview: false,
          isUnauthorized: true,
        };
      }
      throw formatError(error);
    }
  },

  /**
   * Create a new review
   */
  create: async (productId, rating, comment = '') => {
    try {
      const response = await userClient.post(ENDPOINTS.REVIEWS.CREATE, {
        productId,
        rating,
        comment
      });
      const transformed = transformResponse(response);
      
      return {
        success: true,
        data: transformed.data,
        message: transformed.message || 'Review submitted successfully',
      };
    } catch (error) {
      throw formatError(error);
    }
  },

  /**
   * Update a review
   */
  update: async (reviewId, rating, comment = '') => {
    try {
      const response = await userClient.put(ENDPOINTS.REVIEWS.UPDATE(reviewId), {
        rating,
        comment
      });
      const transformed = transformResponse(response);
      
      return {
        success: true,
        data: transformed.data,
        message: transformed.message || 'Review updated successfully',
      };
    } catch (error) {
      throw formatError(error);
    }
  },

  /**
   * Delete a review
   */
  delete: async (reviewId) => {
    try {
      const response = await userClient.delete(ENDPOINTS.REVIEWS.DELETE(reviewId));
      const transformed = transformResponse(response);
      
      return {
        success: true,
        message: transformed.message || 'Review deleted successfully',
      };
    } catch (error) {
      throw formatError(error);
    }
  },
};

export default reviews;
