/**
 * Centralized API - Main Export
 * Single entry point for all API services
 * 
 * Usage:
 *   import { products, cart, orders } from '@/api';
 *   import { ENDPOINTS } from '@/api';
 *   import { API_CONFIG } from '@/api';
 */

// Services
export { products } from './services/products';
export { reviews } from './services/reviews';

// Config
export { API_CONFIG } from './config/apiConfig';
export { ENDPOINTS } from './config/endpoints';

// Clients (for advanced usage)
export { getUserClient, getAdminClient } from './clients/apiClient';

// Utils (for advanced usage)
export { formatError, isAuthError, isForbiddenError } from './utils/errorHandler';
export { logRequest, logResponse, logError } from './utils/requestLogger';
export { transformResponse, extractData } from './utils/responseTransformer';

// Default export - products service for backward compatibility
export { products as default } from './services/products';
