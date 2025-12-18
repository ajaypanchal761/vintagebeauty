/**
 * Centralized Error Handler
 * Handles all API errors consistently across the application
 */

import { API_CONFIG } from '../config/apiConfig';

/**
 * Format error response for consistent error handling
 */
export const formatError = (error) => {
  // Network error (no response) - includes timeout
  if (!error.response) {
    let message = error.message || 'Network error. Please check your connection.';
    
    // Provide helpful message for timeout errors
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      message = 'Request timeout. The server is taking too long to respond. Please try again.';
      
      // In production, check if API URL is configured
      if (!import.meta.env.DEV) {
        const apiUrl = import.meta.env.VITE_API_URL;
        if (!apiUrl) {
          message += ' (Backend URL not configured. Please set VITE_API_URL in Vercel environment variables)';
        }
      }
    }
    
    return {
      success: false,
      message,
      status: 0,
      data: null,
    };
  }

  // HTTP error response
  const { status, data } = error.response;
  
  return {
    success: false,
    message: data?.message || error.message || 'An error occurred',
    status,
    data: data?.data || null,
    errors: data?.errors || null,
  };
};

/**
 * Check if error is a specific status code
 */
export const isErrorStatus = (error, status) => {
  return error.response?.status === status;
};

/**
 * Check if error is authentication related (401)
 */
export const isAuthError = (error) => {
  return isErrorStatus(error, 401);
};

/**
 * Check if error is authorization related (403)
 */
export const isForbiddenError = (error) => {
  return isErrorStatus(error, 403);
};

/**
 * Check if error is not found (404)
 */
export const isNotFoundError = (error) => {
  return isErrorStatus(error, 404);
};

/**
 * Check if error is server error (5xx)
 */
export const isServerError = (error) => {
  const status = error.response?.status;
  return status >= 500 && status < 600;
};

export default {
  formatError,
  isErrorStatus,
  isAuthError,
  isForbiddenError,
  isNotFoundError,
  isServerError,
};
