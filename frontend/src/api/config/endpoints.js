/**
 * API Endpoints - Centralized Endpoint Definitions
 * All API endpoints are defined here for easy management and maintenance
 */

export const ENDPOINTS = {
  // ==================== AUTH ====================
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    SEND_OTP: '/auth/send-otp',
    VERIFY_OTP: '/auth/verify-otp',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
  },

  // ==================== USERS ====================
  USERS: {
    LIST: '/users',
    ME: '/users/me',
    BY_ID: (id) => `/users/${id}`,
    UPDATE: (id) => `/users/${id}`,
    ADMIN_UPDATE: (id) => `/users/${id}/admin-update`,
    ADDRESSES: (id) => `/users/${id}/addresses`,
    ADDRESS_BY_ID: (userId, addressId) => `/users/${userId}/addresses/${addressId}`,
    SEND_OTP: '/users/send-otp',
    VERIFY_OTP: '/users/verify-otp',
    LOGIN: '/users/login',
    REGISTER: '/users/register',
  },

  // ==================== PRODUCTS ====================
  PRODUCTS: {
    LIST: '/products',
    BY_ID: (id) => `/products/${id}`,
    BY_SLUG: (slug) => `/products/slug/${slug}`,
    FEATURED: '/products/featured',
    BESTSELLERS: '/products/bestsellers',
    MOST_LOVED: '/products/most-loved',
    BY_CATEGORY: (categorySlug) => `/products/category/${categorySlug}`,
    CREATE: '/products',
    UPDATE: (id) => `/products/${id}`,
    DELETE: (id) => `/products/${id}`,
  },

  // ==================== CATEGORIES ====================
  CATEGORIES: {
    LIST: '/categories',
    BY_ID: (id) => `/categories/${id}`,
    BY_SLUG: (slug) => `/categories/slug/${slug}`,
    CREATE: '/categories',
    UPDATE: (id) => `/categories/${id}`,
    DELETE: (id) => `/categories/${id}`,
  },

  // ==================== CART ====================
  CART: {
    GET: '/cart',
    ADD: '/cart',
    UPDATE_ITEM: (itemId) => `/cart/${itemId}`,
    REMOVE_ITEM: (itemId) => `/cart/${itemId}`,
    CLEAR: '/cart',
    APPLY_COUPON: '/cart/coupon',
    REMOVE_COUPON: '/cart/coupon',
  },

  // ==================== ORDERS ====================
  ORDERS: {
    CREATE: '/orders',
    LIST: '/orders',
    BY_ID: (id) => `/orders/${id}`,
    CANCEL: (id) => `/orders/${id}/cancel`,
    ADMIN_ALL: '/orders/admin/all',
    UPDATE_STATUS: (id) => `/orders/${id}/status`,
    CANCELLATION: (id) => `/orders/${id}/cancellation`,
    REFUND: (id) => `/orders/${id}/refund`,
    CONFIRM_COD: (id) => `/orders/${id}/confirm-cod`,
  },

  // ==================== PAYMENTS ====================
  PAYMENTS: {
    CREATE: '/payments',
    VERIFY: (id) => `/payments/${id}/verify`,
    BY_ID: (id) => `/payments/${id}`,
    RAZORPAY_ORDER: '/payments/razorpay/order',
    RAZORPAY_VERIFY: '/payments/razorpay/verify',
  },

  // ==================== WISHLIST ====================
  WISHLIST: {
    GET: '/wishlist',
    ADD: '/wishlist',
    REMOVE: (productId) => `/wishlist/${productId}`,
    CHECK: (productId) => `/wishlist/${productId}`,
  },

  // ==================== REVIEWS ====================
  REVIEWS: {
    BY_PRODUCT: (productId) => `/reviews/product/${productId}`,
    CREATE: '/reviews',
    USER_REVIEW: (productId) => `/reviews/product/${productId}/user`,
    UPDATE: (reviewId) => `/reviews/${reviewId}`,
    DELETE: (reviewId) => `/reviews/${reviewId}`,
  },

  // ==================== COUPONS ====================
  COUPONS: {
    LIST: '/coupons',
    BY_CODE: (code) => `/coupons/${code}`,
    VALIDATE: (code) => `/coupons/${code}/validate`,
    ADMIN_LIST: '/coupons',
    ADMIN_CREATE: '/coupons',
    ADMIN_UPDATE: (id) => `/coupons/${id}`,
    ADMIN_DELETE: (id) => `/coupons/${id}`,
  },

  // ==================== BLOG ====================
  BLOG: {
    LIST: '/blog',
    BY_ID: (id) => `/blog/${id}`,
    BY_SLUG: (slug) => `/blog/slug/${slug}`,
    CREATE: '/blog',
    UPDATE: (id) => `/blog/${id}`,
    DELETE: (id) => `/blog/${id}`,
  },

  // ==================== HERO CAROUSEL ====================
  HERO_CAROUSEL: {
    LIST: '/hero-carousel',
    BY_ID: (id) => `/hero-carousel/${id}`,
    CREATE: '/hero-carousel',
    UPDATE: (id) => `/hero-carousel/${id}`,
    DELETE: (id) => `/hero-carousel/${id}`,
  },

  // ==================== COMBO DEALS ====================
  COMBO_DEALS: {
    LIST: '/combo-deals',
    BY_ID: (id) => `/combo-deals/${id}`,
    CREATE: '/combo-deals',
    UPDATE: (id) => `/combo-deals/${id}`,
    DELETE: (id) => `/combo-deals/${id}`,
  },

  // ==================== ANNOUNCEMENTS ====================
  ANNOUNCEMENTS: {
    LIST: '/announcements',
    ACTIVE: '/announcements/active',
    BY_ID: (id) => `/announcements/${id}`,
    CREATE: '/announcements',
    UPDATE: (id) => `/announcements/${id}`,
    DELETE: (id) => `/announcements/${id}`,
  },

  // ==================== POLICIES ====================
  POLICIES: {
    LIST: '/policies',
    BY_TYPE: (type) => `/policies/${type}`,
    CREATE: '/policies',
    UPDATE: (id) => `/policies/${id}`,
    DELETE: (id) => `/policies/${id}`,
  },

  // ==================== SUPPORT ====================
  SUPPORT: {
    QUERIES: '/support/queries',
    TICKETS: '/support/tickets',
    MY_SUPPORT: '/support/my',
    QUERY_BY_ID: (id) => `/support/queries/${id}`,
    TICKET_BY_ID: (id) => `/support/tickets/${id}`,
  },

  // ==================== ADMIN ====================
  ADMIN: {
    LOGIN: '/admin/login',
    REGISTER: '/admin/register',
    ME: '/admin/me',
    DASHBOARD: '/admin/dashboard',
    ANALYTICS: '/admin/analytics',
    USERS: '/admin/users',
    USER_BY_ID: (id) => `/admin/users/${id}`,
  },

  // ==================== ANALYTICS ====================
  ANALYTICS: {
    USER_ANALYTICS: '/analytics/users',
    PRODUCT_ANALYTICS: '/analytics/products',
    ORDER_ANALYTICS: '/analytics/orders',
  },
};

export default ENDPOINTS;
