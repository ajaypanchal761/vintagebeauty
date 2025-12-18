import axios from 'axios';
import { navigateTo } from '../utils/navigationHelper';
import { useAuthStore } from '../store/authStore';
import { API_CONFIG } from '../api/config/apiConfig';

// Create axios instance using centralized API config
const api = axios.create({
  baseURL: API_CONFIG.baseURL,
  headers: API_CONFIG.headers,
  timeout: API_CONFIG.timeout,
  withCredentials: API_CONFIG.withCredentials,
});

// Request interceptor - Add token to requests (skip for public endpoints and admin routes)
api.interceptors.request.use(
  (config) => {
    // Don't add user token for public endpoints (login, register, admin login, admin register, OTP auth, public product/carousel/combo endpoints)
    const isPublicEndpoint = config.url?.includes('/users/login') || 
                            config.url?.includes('/users/register') ||
                            config.url?.includes('/users/send-otp') ||
                            config.url?.includes('/users/verify-otp') ||
                            config.url?.includes('/auth/send-otp') ||
                            config.url?.includes('/auth/verify-otp') ||
                            config.url?.includes('/admin/login') ||
                            config.url?.includes('/admin/register') ||
                            config.url?.includes('/hero-carousel') ||
                            config.url?.includes('/combo-deals');
    
    // Don't add user token to admin routes - admin routes should use adminApi with adminToken
    const isAdminRoute = config.url?.includes('/admin/') && !isPublicEndpoint;
    
    if (!isPublicEndpoint && !isAdminRoute) {
      // Try to get token from Zustand store first, then localStorage
      const authStore = useAuthStore.getState();
      let token = authStore.token || localStorage.getItem('token');
      
      // Trim token to remove any whitespace and ensure it's a valid string
      if (token) {
        token = String(token).trim();
        // Only add token if it's not empty after trimming
        if (token.length > 0) {
          // CRITICAL: Always set Authorization header with Bearer token
          config.headers.Authorization = `Bearer ${token}`;
          
          // Debug logging (only in development)
          if (import.meta.env.DEV) {
            console.log('API Request - Token attached:', {
              url: config.url,
              method: config.method,
              hasToken: !!token,
              tokenLength: token.length,
              tokenPrefix: token.substring(0, 20) + '...',
              authHeaderSet: !!config.headers.Authorization,
              authHeaderValue: config.headers.Authorization?.substring(0, 30) + '...'
            });
          }
        } else {
          console.error('Token is empty after trimming for endpoint:', config.url);
        }
      } else {
        // Log warning if no token found for protected endpoint
        console.warn('No token found for protected endpoint:', config.url);
        if (import.meta.env.DEV) {
          console.warn('Token sources checked:', {
            authStoreToken: !!authStore.token,
            localStorageToken: !!localStorage.getItem('token'),
            authStoreState: {
              isAuthenticated: authStore.isAuthenticated,
              hasUser: !!authStore.user
            }
          });
        }
      }
    } else if (isAdminRoute) {
      // Log warning if user token is being sent to admin route
      console.warn('User API instance used for admin route - should use adminApi instead:', config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const currentPath = window.location.pathname;
    const errorMessage = error.response?.data?.message || error.message || '';
    const requestUrl = error.config?.url || '';
    
    // Check if this is a user API endpoint (not admin endpoint)
    const isUserEndpoint = requestUrl.includes('/users/me') || 
                          requestUrl.includes('/users/') && !requestUrl.includes('/admin');
    
    // Check if we're on a user page (not admin page)
    const isUserPage = !currentPath.startsWith('/admin');
    const isAdminError = errorMessage.toLowerCase().includes('admin not found') || 
                        (errorMessage.toLowerCase().includes('admin') && 
                         (errorMessage.toLowerCase().includes('not found') || 
                          errorMessage.toLowerCase().includes('required') ||
                          errorMessage.toLowerCase().includes('authorized')));
    
    // CRITICAL: Don't suppress admin errors on user endpoints - these are real errors
    // Only suppress on login/signup pages to prevent confusion during authentication
    if (isUserEndpoint && isAdminError) {
      // This is a real error - user token is being validated as admin token
      // Log it but don't suppress - let the error show
      console.error('CRITICAL: Admin error on user endpoint - route/middleware mismatch:', {
        url: requestUrl,
        error: errorMessage,
        path: currentPath
      });
      // Don't suppress - let real error propagate
    } else if ((currentPath === '/login' || currentPath === '/signup') && isAdminError) {
      // Only suppress admin errors on login/signup pages
      console.warn('Admin error suppressed on login/signup page:', errorMessage);
      const suppressedError = new Error('Admin error suppressed');
      suppressedError.suppressed = true;
      suppressedError.originalError = error;
      return Promise.reject(suppressedError);
    }
    
    if (error.response?.status === 401) {
      // Token expired or invalid
      const requestUrl = error.config?.url || '';
      const isGetCurrentUser = requestUrl.includes('/users/me');
      
      // Don't redirect if already on login/signup pages
      if (currentPath === '/login' || currentPath === '/admin/login' || currentPath === '/signup') {
        return Promise.reject(error);
      }
      
      // Check if login happened recently (within last 10 seconds) - extended grace period
      const loginTimestamp = localStorage.getItem('loginTimestamp');
      const timeSinceLogin = loginTimestamp ? Date.now() - parseInt(loginTimestamp) : Infinity;
      const isRecentLogin = timeSinceLogin < 10000; // 10 second grace period (increased from 5)
      
      // Get token from multiple sources to verify it exists
      const authStore = useAuthStore.getState();
      const tokenFromStore = authStore.token;
      const tokenFromStorage = localStorage.getItem('token');
      const hasToken = !!(tokenFromStore || tokenFromStorage);
      
      // Log token status for debugging
      if (import.meta.env.DEV) {
        console.log('401 Error Debug:', {
          url: requestUrl,
          hasToken: hasToken,
          tokenFromStore: !!tokenFromStore,
          tokenFromStorage: !!tokenFromStorage,
          isRecentLogin,
          timeSinceLogin,
          currentPath
        });
      }
      
      // CRITICAL: Only logout if we're absolutely sure the token is invalid
      // For /users/me endpoint, be very conservative - don't logout on first 401
      if (isGetCurrentUser) {
        // For /users/me, only logout if:
        // 1. No token exists at all, OR
        // 2. Not a recent login AND we've confirmed token is actually invalid (not just a timing issue)
        
        if (!hasToken) {
          // No token at all - safe to logout
          console.warn('No token found, logging out');
          const { logout } = useAuthStore.getState();
          logout();
          sessionStorage.setItem('returnPath', currentPath);
          navigateTo('/login', { replace: true });
          return Promise.reject(error);
        }
        
        // If recent login, don't logout - let component handle retry
        if (isRecentLogin) {
          console.warn('401 on /users/me shortly after login - might be timing issue, NOT logging out');
          // Don't logout, just reject the error and let component handle retry
          return Promise.reject(error);
        }
        
        // Not recent login - but still be conservative
        // Only logout if we're on a protected route and token seems truly invalid
        // Check if token was actually sent in the request
        const tokenWasSent = error.config?.headers?.Authorization?.includes('Bearer');
        
        if (!tokenWasSent) {
          // Token wasn't sent - this is a configuration issue, not token invalidity
          console.error('Token was not sent in request headers - configuration issue');
          // Don't logout, just log the error
          return Promise.reject(error);
        }
        
        // Token was sent but still got 401 - might be invalid
        // But wait - check if this is the first 401 or a repeated one
        // We'll let the component handle it first, and only logout if component explicitly requests it
        console.warn('401 on /users/me - token might be invalid, but letting component handle it first');
        // Don't logout automatically - let component decide
        return Promise.reject(error);
      } else {
        // For other endpoints (not /users/me), be more aggressive but still check recent login
        if (!hasToken) {
          // No token at all, safe to logout
          const { logout } = useAuthStore.getState();
          logout();
          return Promise.reject(error);
        }
        
        // For other endpoints, only logout if not recent login
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

export default api;

