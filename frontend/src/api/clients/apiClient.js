/**
 * Unified API Client Factory
 * Creates and configures axios instances for user and admin APIs
 */



import axios from 'axios';
import { API_CONFIG } from '../config/apiConfig';
import {
  setupUserRequestInterceptor,
  setupAdminRequestInterceptor,
  setupUserResponseInterceptor,
  setupAdminResponseInterceptor,
} from './interceptors';

/**
 * Create user API client
 */
const createUserClient = () => {
  const client = axios.create({
    baseURL: API_CONFIG.baseURL,
    timeout: API_CONFIG.timeout,
    headers: API_CONFIG.headers,
    withCredentials: API_CONFIG.withCredentials,
  });

  // Setup interceptors
  setupUserRequestInterceptor(client);
  setupUserResponseInterceptor(client);

  return client;
};

/**
 * Create admin API client
 */
const createAdminClient = () => {
  const client = axios.create({
    baseURL: API_CONFIG.baseURL,
    timeout: API_CONFIG.timeout,
    headers: API_CONFIG.headers,
    withCredentials: API_CONFIG.withCredentials,
  });

  // Setup interceptors
  setupAdminRequestInterceptor(client);
  setupAdminResponseInterceptor(client);

  return client;
};

// Create singleton instances
let userClient = null;
let adminClient = null;
let lastBaseURL = null;

/**
 * Reset clients (useful when API URL changes)
 */
export const resetClients = () => {
  userClient = null;
  adminClient = null;
  lastBaseURL = null;
};

/**
 * Get user API client (singleton)
 */
export const getUserClient = () => {
  // Reset if baseURL changed
  if (lastBaseURL !== API_CONFIG.baseURL) {
    resetClients();
    lastBaseURL = API_CONFIG.baseURL;
  }
  
  if (!userClient) {
    userClient = createUserClient();
    
    // Log in development
    if (import.meta.env.DEV) {
      console.log('🔧 Created user API client:', {
        baseURL: API_CONFIG.baseURL,
        timeout: API_CONFIG.timeout
      });
    }
  }
  return userClient;
};

/**
 * Get admin API client (singleton)
 */
export const getAdminClient = () => {
  // Reset if baseURL changed
  if (lastBaseURL !== API_CONFIG.baseURL) {
    resetClients();
    lastBaseURL = API_CONFIG.baseURL;
  }
  
  if (!adminClient) {
    adminClient = createAdminClient();
    
    // Log in development
    if (import.meta.env.DEV) {
      console.log('🔧 Created admin API client:', {
        baseURL: API_CONFIG.baseURL,
        timeout: API_CONFIG.timeout
      });
    }
  }
  return adminClient;
};

/**
 * Default export - user client for backward compatibility
 */
const apiClient = getUserClient();
export default apiClient;

/**
 * Export both clients
 */
export { getUserClient as userClient, getAdminClient as adminClient };
