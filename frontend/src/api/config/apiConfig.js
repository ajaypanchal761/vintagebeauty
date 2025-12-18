/**
 * API Configuration - Single Source of Truth
 * All API-related configuration is managed here
 * 
 * Backend Base URL is configured via VITE_API_URL environment variable
 * Default: https://vintagebeauty-1.onrender.com/api
 */

// Get API URL from environment variable
// This is the ONLY place where backend URL should be configured
const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  
  // If environment variable is set, use it
  if (envUrl && envUrl.trim()) {
    const cleanUrl = envUrl.trim().replace(/\/$/, ''); // Remove trailing slash
    const finalUrl = cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
    return finalUrl;
  }
  
  // Default to production URL if environment variable not set
  // This ensures production builds always work
  return 'https://vintagebeauty-1.onrender.com/api';
};

// Get baseURL value from environment or use production default
const baseURLValue = getApiUrl();

export const API_CONFIG = {
  // Base URL for all API requests
  baseURL: baseURLValue,
  
  // Request timeout in milliseconds (increased for slow connections)
  timeout: 60000, // 60 seconds
  
  // Default headers
  headers: {
    'Content-Type': 'application/json',
  },
  
  // Axios configuration
  withCredentials: true,
  
  // Public endpoints that don't require authentication
  publicEndpoints: [
    '/users/login',
    '/users/register',
    '/users/send-otp',
    '/users/verify-otp',
    '/auth/send-otp',
    '/auth/verify-otp',
    '/admin/login',
    '/admin/register',
    '/hero-carousel',
    '/combo-deals',
  ],
  
  // Enable API logging in development
  enableLogging: import.meta.env.DEV,
  
  // Recent login grace period (ms) - don't logout on 401 if login was recent
  recentLoginGracePeriod: 10000, // 10 seconds
};

export default API_CONFIG;
