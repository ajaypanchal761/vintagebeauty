/**
 * Centralized API Interceptors
 * Handles request and response interceptors for both user and admin APIs
 */

import { API_CONFIG } from '../config/apiConfig';
import { navigateTo } from '../../utils/navigationHelper';
import { useAuthStore } from '../../store/authStore';
import { logRequest, logResponse, logError } from '../utils/requestLogger';

/**
 * Setup request interceptors for user API
 */
export const setupUserRequestInterceptor = (client) => {
  client.interceptors.request.use(
    (config) => {
      // Log request
      logRequest(config);

      // Check if endpoint is public
      const isPublicEndpoint = API_CONFIG.publicEndpoints.some(endpoint => 
        config.url?.includes(endpoint)
      );

      // Check if it's an admin route
      const isAdminRoute = config.url?.includes('/admin/') && !isPublicEndpoint;

      // Don't add token for public endpoints or admin routes
      if (!isPublicEndpoint && !isAdminRoute) {
        // Get token from Zustand store or localStorage
        const authStore = useAuthStore.getState();
        let token = authStore.token || localStorage.getItem('token');

        if (token) {
          token = String(token).trim();
          if (token.length > 0) {
            config.headers.Authorization = `Bearer ${token}`;
            
            if (API_CONFIG.enableLogging) {
              console.log('[API] Token attached to request:', {
                url: config.url,
                method: config.method,
                hasToken: true,
              });
            }
          }
        } else {
          if (API_CONFIG.enableLogging) {
            console.warn('[API] No token found for protected endpoint:', config.url);
          }
        }
      } else if (isAdminRoute) {
        console.warn('[API] User API instance used for admin route - should use adminApi instead:', config.url);
      }

      return config;
    },
    (error) => {
      logError(error);
      return Promise.reject(error);
    }
  );
};

/**
 * Setup request interceptors for admin API
 */
export const setupAdminRequestInterceptor = (client) => {
  client.interceptors.request.use(
    (config) => {
      // Log request
      logRequest(config);

      // Add admin token
      const adminToken = localStorage.getItem('adminToken');
      if (adminToken) {
        config.headers.Authorization = `Bearer ${adminToken}`;
      }

      return config;
    },
    (error) => {
      logError(error);
      return Promise.reject(error);
    }
  );
};

/**
 * Setup response interceptors for user API
 */
export const setupUserResponseInterceptor = (client) => {
  client.interceptors.response.use(
    (response) => {
      // Log successful response
      logResponse(response);
      return response;
    },
    (error) => {
      // Log error
      logError(error);

      const currentPath = window.location.pathname;
      const errorMessage = error.response?.data?.message || error.message || '';
      const requestUrl = error.config?.url || '';

      // Handle admin errors on user endpoints
      const isUserEndpoint = requestUrl.includes('/users/me') || 
                            (requestUrl.includes('/users/') && !requestUrl.includes('/admin'));
      const isUserPage = !currentPath.startsWith('/admin');
      const isAdminError = errorMessage.toLowerCase().includes('admin not found') || 
                          (errorMessage.toLowerCase().includes('admin') && 
                           (errorMessage.toLowerCase().includes('not found') || 
                            errorMessage.toLowerCase().includes('required') ||
                            errorMessage.toLowerCase().includes('authorized')));

      if (isUserEndpoint && isAdminError) {
        console.error('[API] Admin error on user endpoint - route/middleware mismatch:', {
          url: requestUrl,
          error: errorMessage,
          path: currentPath
        });
      } else if ((currentPath === '/login' || currentPath === '/signup') && isAdminError) {
        console.warn('[API] Admin error suppressed on login/signup page:', errorMessage);
        const suppressedError = new Error('Admin error suppressed');
        suppressedError.suppressed = true;
        suppressedError.originalError = error;
        return Promise.reject(suppressedError);
      }

      // Handle 401 errors
      if (error.response?.status === 401) {
        const requestUrl = error.config?.url || '';
        const isGetCurrentUser = requestUrl.includes('/users/me');

        // Don't redirect if already on login/signup pages
        if (currentPath === '/login' || currentPath === '/admin/login' || currentPath === '/signup') {
          return Promise.reject(error);
        }

        // Check recent login grace period
        const loginTimestamp = localStorage.getItem('loginTimestamp');
        const timeSinceLogin = loginTimestamp ? Date.now() - parseInt(loginTimestamp) : Infinity;
        const isRecentLogin = timeSinceLogin < API_CONFIG.recentLoginGracePeriod;

        // Get token from multiple sources
        const authStore = useAuthStore.getState();
        const tokenFromStore = authStore.token;
        const tokenFromStorage = localStorage.getItem('token');
        const hasToken = !!(tokenFromStore || tokenFromStorage);

        if (API_CONFIG.enableLogging) {
          console.log('[API] 401 Error Debug:', {
            url: requestUrl,
            hasToken,
            isRecentLogin,
            timeSinceLogin,
            currentPath
          });
        }

        // Handle /users/me endpoint specially
        if (isGetCurrentUser) {
          if (!hasToken) {
            console.warn('[API] No token found, logging out');
            const { logout } = useAuthStore.getState();
            logout();
            sessionStorage.setItem('returnPath', currentPath);
            navigateTo('/login', { replace: true });
            return Promise.reject(error);
          }

          if (isRecentLogin) {
            console.warn('[API] 401 on /users/me shortly after login - might be timing issue, NOT logging out');
            return Promise.reject(error);
          }

          const tokenWasSent = error.config?.headers?.Authorization?.includes('Bearer');
          if (!tokenWasSent) {
            console.error('[API] Token was not sent in request headers - configuration issue');
            return Promise.reject(error);
          }

          console.warn('[API] 401 on /users/me - token might be invalid, but letting component handle it first');
          return Promise.reject(error);
        } else {
          // For other endpoints
          if (!hasToken) {
            const { logout } = useAuthStore.getState();
            logout();
            return Promise.reject(error);
          }

          if (!isRecentLogin) {
            const isProtectedRoute = currentPath.startsWith('/account') || 
                                     currentPath.startsWith('/orders') ||
                                     currentPath.startsWith('/addresses') ||
                                     currentPath.startsWith('/order-summary') ||
                                     currentPath.startsWith('/payment') ||
                                     currentPath.startsWith('/order-success');

            if (isProtectedRoute) {
              const { logout } = useAuthStore.getState();
              logout();
              sessionStorage.setItem('returnPath', currentPath);
              navigateTo('/login', { replace: true });
            }
          }
        }
      }

      return Promise.reject(error);
    }
  );
};

/**
 * Setup response interceptors for admin API
 */
export const setupAdminResponseInterceptor = (client) => {
  client.interceptors.response.use(
    (response) => {
      // Log successful response
      logResponse(response);
      return response;
    },
    (error) => {
      // Log error
      logError(error);

      // Handle 401 errors
      if (error.response?.status === 401) {
        const currentPath = window.location.pathname;
        const isLoginPage = currentPath.includes('/admin/login') || currentPath.includes('/admin/login-otp');

        if (!isLoginPage) {
          const adminToken = localStorage.getItem('adminToken');
          if (!adminToken) {
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
};

export default {
  setupUserRequestInterceptor,
  setupAdminRequestInterceptor,
  setupUserResponseInterceptor,
  setupAdminResponseInterceptor,
};
