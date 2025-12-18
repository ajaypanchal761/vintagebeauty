import axios from 'axios';
import { API_CONFIG } from '../api/config/apiConfig';

// Create axios instance for admin API calls using centralized API config
const adminApi = axios.create({
  baseURL: API_CONFIG.baseURL,
  headers: API_CONFIG.headers,
  timeout: API_CONFIG.timeout,
  withCredentials: API_CONFIG.withCredentials,
});

// Request interceptor - Add adminToken to requests
adminApi.interceptors.request.use(
  (config) => {
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
adminApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect if we're not already on a login page
      // and if the error is not from a component that's handling it
      const currentPath = window.location.pathname;
      const isLoginPage = currentPath.includes('/admin/login') || currentPath.includes('/admin/login-otp');
      
      if (!isLoginPage) {
        // Check if adminToken exists - if it doesn't, we're already logged out
        const adminToken = localStorage.getItem('adminToken');
        if (!adminToken) {
          // Already logged out, just reject the error
          return Promise.reject(error);
        }
        
        // Token exists but is invalid - clear and redirect
        localStorage.removeItem('adminToken');
        localStorage.removeItem('admin_logged_in');
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

export default adminApi;

