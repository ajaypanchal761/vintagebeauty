/**
 * API Request Logger
 * Centralized logging for all API requests and responses
 */

import { API_CONFIG } from '../config/apiConfig';

/**
 * Log API request
 */
export const logRequest = (config) => {
  if (!API_CONFIG.enableLogging) return;

  const { method, url, params, data } = config;
  
  console.group(`[API] ${method?.toUpperCase()} ${url}`);
  if (params) {
    console.log('Params:', params);
  }
  if (data && !(data instanceof FormData)) {
    console.log('Data:', data);
  }
  console.groupEnd();
};

/**
 * Log API response
 */
export const logResponse = (response) => {
  if (!API_CONFIG.enableLogging) return;

  const { config, status, data } = response;
  const { method, url } = config;
  
  console.group(`[API] ${method?.toUpperCase()} ${url} - ${status} OK`);
  console.log('Response:', data);
  console.groupEnd();
};

/**
 * Log API error
 */
export const logError = (error) => {
  if (!API_CONFIG.enableLogging) return;

  const { config, response } = error;
  
  if (config) {
    const { method, url } = config;
    const status = response?.status || 'NETWORK ERROR';
    const message = response?.data?.message || error.message;
    
    console.group(`[API] ${method?.toUpperCase()} ${url} - ${status} ERROR`);
    console.error('Error:', message);
    if (response?.data) {
      console.error('Response Data:', response.data);
    }
    console.groupEnd();
  } else {
    console.error('[API] Error:', error);
  }
};

export default {
  logRequest,
  logResponse,
  logError,
};
