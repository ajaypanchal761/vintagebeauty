/**
 * Activity Tracker Utility
 * Handles user activity tracking for analytics
 * Works for both authenticated and anonymous users
 */

import userAnalyticsService from '../services/userAnalyticsService';

// Get or create session ID for anonymous users
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

// Get current user ID (if authenticated)
const getUserId = () => {
  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const authData = JSON.parse(authStorage);
      return authData?.state?.user?._id || authData?.state?.user?.id || null;
    }
  } catch (error) {
    // Ignore parsing errors
  }
  return null;
};

/**
 * Track user activity
 * @param {Object} activityData - Activity data to track
 * @param {string} activityData.activityType - Type of activity (product_view, add_to_cart, category_visit, etc.)
 * @param {string} activityData.productId - Product ID (optional)
 * @param {string} activityData.categoryId - Category ID (optional)
 * @param {string} activityData.categoryName - Category name (optional)
 * @param {string} activityData.productName - Product name (optional)
 * @param {string} activityData.searchQuery - Search query (optional)
 * @param {string} activityData.pageUrl - Page URL (optional)
 */
export const trackActivity = async (activityData) => {
  try {
    const userId = getUserId();
    const sessionId = getSessionId();
    const pageUrl = window.location.pathname + window.location.search;

    const trackingData = {
      userId: userId || null,
      sessionId: userId ? null : sessionId, // Only use sessionId for anonymous users
      activityType: activityData.activityType,
      productId: activityData.productId || null,
      categoryId: activityData.categoryId || null,
      categoryName: activityData.categoryName || null,
      productName: activityData.productName || null,
      searchQuery: activityData.searchQuery || null,
      pageUrl: activityData.pageUrl || pageUrl,
      metadata: activityData.metadata || {}
    };

    // Fire and forget - don't block UI
    userAnalyticsService.trackActivity(trackingData).catch(error => {
      // Silently fail - don't log errors to avoid console spam
      // Analytics tracking should never break the user experience
      if (import.meta.env.DEV) {
        console.debug('Activity tracking failed (non-critical):', error);
      }
    });
  } catch (error) {
    // Silently fail - analytics should never break the app
    if (import.meta.env.DEV) {
      console.debug('Activity tracking error (non-critical):', error);
    }
  }
};

/**
 * Track product view
 */
export const trackProductView = async (product) => {
  if (!product) return;
  
  await trackActivity({
    activityType: 'product_view',
    productId: product._id || product.id,
    productName: product.name,
    categoryName: product.categoryName || product.category?.name,
    categoryId: product.category?._id || product.category?.id || product.categoryId
  });
};

/**
 * Track add to cart
 */
export const trackAddToCart = async (product, quantity = 1) => {
  if (!product) return;
  
  await trackActivity({
    activityType: 'add_to_cart',
    productId: product._id || product.id,
    productName: product.name,
    categoryName: product.categoryName || product.category?.name,
    categoryId: product.category?._id || product.category?.id || product.categoryId,
    metadata: {
      quantity,
      price: product.price || product.selectedPrice || 0
    }
  });
};

/**
 * Track category visit
 */
export const trackCategoryVisit = async (categoryName, categoryId = null) => {
  if (!categoryName) return;
  
  await trackActivity({
    activityType: 'category_visit',
    categoryName,
    categoryId
  });
};

/**
 * Track search
 */
export const trackSearch = async (searchQuery) => {
  if (!searchQuery || searchQuery.trim() === '') return;
  
  await trackActivity({
    activityType: 'search',
    searchQuery: searchQuery.trim()
  });
};

/**
 * Track page view
 */
export const trackPageView = async (pageName = null) => {
  await trackActivity({
    activityType: 'page_view',
    pageUrl: window.location.pathname + window.location.search,
    metadata: {
      pageName: pageName || window.location.pathname
    }
  });
};

export default {
  trackActivity,
  trackProductView,
  trackAddToCart,
  trackCategoryVisit,
  trackSearch,
  trackPageView
};

