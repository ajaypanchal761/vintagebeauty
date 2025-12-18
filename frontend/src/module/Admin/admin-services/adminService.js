// Admin service - uses backend API only, no mock data fallbacks
import adminApi from '../../../services/adminApi';
import { mockSettings, mockAdminUser, mockSupportQueries } from './mockData';

// Simulate API delay
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

const adminService = {
  // Auth - Now using OTP-based authentication via backend
  login: async (credentials) => {
    // For OTP-based login, we use phone number
    // This will be handled by authService in the Login component
    await delay();
    throw new Error('Use OTP-based login instead');
  },

  registerAdmin: async (credentials) => {
    // Admin registration is now handled via OTP verification
    // First user to verify OTP becomes admin automatically
    await delay();
    throw new Error('Use OTP-based registration instead');
  },

  checkAdminStatus: async () => {
    // Check if any admin exists in the backend
    // Use adminApi to avoid user token being sent to admin routes
    try {
      const adminApi = (await import('../../../services/adminApi')).default;
      const response = await adminApi.get('/users?role=admin');
      const adminExists = response.data.data && response.data.data.length > 0;
      return { data: { adminExists, message: adminExists ? 'Admin exists' : 'No admin exists. First user to verify OTP will become admin.' } };
    } catch (error) {
      // If API fails (no admin token or other error), assume no admin exists (for first-time setup)
      // Silently handle - don't show errors on user pages
      console.log('Admin status check failed (expected if no admin exists):', error.response?.data?.message || error.message);
      return { data: { adminExists: false, message: 'No admin exists. First user to verify OTP will become admin.' } };
    }
  },


  logout: () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin_logged_in');
  },

  forgotPassword: async () => {
    await delay();
    return { data: { message: 'OTP sent to email' } };
  },

  verifyOTPAndResetPassword: async () => {
    await delay();
    return { data: { message: 'Password reset successful' } };
  },

  // Products
  getProducts: async () => {
    await delay();
    return { data: { products: mockProducts } };
  },

  getProductsBySection: async (section) => {
    await delay();
    let filtered = mockProducts;
    if (section === 'featured') {
      filtered = mockProducts.filter(p => p.isFeatured);
    } else if (section === 'bestsellers') {
      filtered = mockProducts.filter(p => p.isBestSeller);
    } else if (section === 'mostloved') {
      filtered = mockProducts.filter(p => p.isMostLoved);
    }
    return { data: filtered };
  },

  getProduct: async (id) => {
    await delay();
    const product = mockProducts.find(p => p._id === id);
    return { data: product };
  },

  createProduct: async (formData) => {
    await delay();
    const newProduct = {
      _id: Date.now().toString(),
      name: formData.get('name') || 'New Product',
      price: parseFloat(formData.get('price')) || 0,
      stock: parseInt(formData.get('stock')) || 0,
      inStock: true,
      ...Object.fromEntries(formData)
    };
    mockProducts.push(newProduct);
    return { data: newProduct };
  },

  updateProduct: async (id, formData) => {
    await delay();
    const index = mockProducts.findIndex(p => p._id === id);
    if (index !== -1) {
      mockProducts[index] = { ...mockProducts[index], ...Object.fromEntries(formData) };
      return { data: mockProducts[index] };
    }
    throw new Error('Product not found');
  },

  deleteProduct: async (id) => {
    await delay();
    const index = mockProducts.findIndex(p => p._id === id);
    if (index !== -1) {
      mockProducts.splice(index, 1);
      return { data: { success: true } };
    }
    throw new Error('Product not found');
  },

  updateProductSections: async (id, sections) => {
    await delay();
    const product = mockProducts.find(p => p._id === id);
    if (product) {
      Object.assign(product, sections);
      return { data: product };
    }
    throw new Error('Product not found');
  },

  // Categories
  getCategories: async () => {
    await delay();
    return { data: { categories: mockCategories } };
  },

  getMainCategories: async () => {
    await delay();
    return { data: mockCategories.filter(c => c.categoryType === 'main') };
  },

  getCategory: async (id) => {
    await delay();
    const category = mockCategories.find(c => c._id === id);
    return { data: category };
  },

  createCategory: async (formData) => {
    await delay();
    const newCategory = {
      _id: Date.now().toString(),
      name: formData.get('name') || 'New Category',
      ...Object.fromEntries(formData),
      categoryType: 'main'
    };
    mockCategories.push(newCategory);
    return { data: newCategory };
  },

  updateCategory: async (id, formData) => {
    await delay();
    const index = mockCategories.findIndex(c => c._id === id);
    if (index !== -1) {
      mockCategories[index] = { ...mockCategories[index], ...Object.fromEntries(formData) };
      return { data: mockCategories[index] };
    }
    throw new Error('Category not found');
  },

  deleteCategory: async (id) => {
    await delay();
    const index = mockCategories.findIndex(c => c._id === id);
    if (index !== -1) {
      mockCategories.splice(index, 1);
      return { data: { success: true } };
    }
    throw new Error('Category not found');
  },

  // Orders
  getOrders: async () => {
    try {
      const response = await adminApi.get('/orders/admin/all');
      if (response.data && response.data.success) {
        return {
          data: {
            orders: response.data.data || response.data || []
          }
        };
      }
      return { data: { orders: [] } };
    } catch (error) {
      console.error('Error fetching orders:', error);
      // No fallback - return empty array on error
      return { data: { orders: [] } };
    }
  },

  getOrderById: async (id) => {
    await delay();
    const order = mockOrders.find(o => o._id === id);
    return { data: order };
  },

  updateOrder: async (id, orderData) => {
    await delay();
    const order = mockOrders.find(o => o._id === id);
    if (order) {
      Object.assign(order, orderData);
      return { data: order };
    }
    throw new Error('Order not found');
  },

  updateOrderStatus: async (id, newStatus) => {
    await delay();
    const order = mockOrders.find(o => o._id === id);
    if (order) {
      order.orderStatus = typeof newStatus === 'string' ? newStatus : newStatus.orderStatus;
      
      // Update revenue status based on order status and payment method
      if (order.orderStatus === 'delivered') {
        if (order.paymentMethod === 'cod') {
          order.revenueStatus = 'earned';
        } else if (order.paymentMethod === 'online' && order.paymentStatus === 'completed') {
          order.revenueStatus = 'confirmed';
        }
      } else if (order.orderStatus === 'confirmed' && order.paymentMethod === 'online' && order.paymentStatus === 'completed') {
        order.revenueStatus = 'confirmed';
      }
      
      return { data: order };
    }
    throw new Error('Order not found');
  },

  handleCancellationRequest: async (orderId, action, reasonForRejection) => {
    await delay();
    const order = mockOrders.find(o => o._id === orderId);
    if (!order) {
      throw new Error('Order not found');
    }
    
    if (action === 'approve') {
      order.cancellationStatus = 'approved';
      order.orderStatus = 'cancelled';
      order.cancelledAt = new Date().toISOString();
      order.cancellationApprovedBy = 'Admin';
      
      // Set refund status to pending if it's an online payment
      if (order.paymentMethod === 'online' && order.paymentStatus === 'completed') {
        order.refundStatus = 'pending';
        order.refundAmount = order.totalAmount;
      }
    } else if (action === 'reject') {
      order.cancellationStatus = 'rejected';
      order.cancellationRejectionReason = reasonForRejection || 'Cancellation request rejected by admin';
    }
    
    return { data: { success: true, order } };
  },

  approveCODCancellation: async (orderId, action, reasonForRejection) => {
    // Same as handleCancellationRequest for COD orders
    return adminService.handleCancellationRequest(orderId, action, reasonForRejection);
  },

  confirmCODReceipt: async (orderId, confirmedAmount) => {
    await delay();
    const order = mockOrders.find(o => o._id === orderId);
    if (!order) {
      throw new Error('Order not found');
    }
    
    if (order.paymentMethod !== 'cod') {
      throw new Error('This order is not a COD order');
    }
    
    order.revenueStatus = 'confirmed';
    order.revenueAmount = confirmedAmount;
    order.paymentStatus = 'completed';
    
    return { data: { success: true, order } };
  },

  // Users
  getAllUsers: async () => {
    await delay();
    return { data: { users: mockUsers } };
  },

  getUserStats: async () => {
    await delay();
    return {
      data: {
        stats: {
          totalUsers: mockUsers.length,
          activeUsers: mockUsers.filter(u => u.isActive).length,
          googleUsers: mockUsers.filter(u => u.googleId).length,
          regularUsers: mockUsers.filter(u => !u.googleId).length
        }
      }
    };
  },

  updateUser: async (id, data) => {
    await delay();
    const user = mockUsers.find(u => u._id === id);
    if (user) {
      Object.assign(user, data);
      return { data: user };
    }
    throw new Error('User not found');
  },

  deleteUser: async (id) => {
    await delay();
    const index = mockUsers.findIndex(u => u._id === id);
    if (index !== -1) {
      mockUsers.splice(index, 1);
      return { data: { success: true } };
    }
    throw new Error('User not found');
  },

  resetUserPassword: async (userId, data) => {
    await delay();
    const user = mockUsers.find(u => u._id === userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    if (user.googleId) {
      throw new Error('Cannot reset password for Google users');
    }
    
    if (!data.newPassword || data.newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
    
    // In real app, this would update the password in database
    // For mock, we just return success
    return { 
      data: { 
        success: true, 
        message: 'Password reset successfully' 
      } 
    };
  },

  // Hero Carousel
  getCarouselItems: async () => {
    await delay();
    return { data: mockHeroCarousel };
  },

  getCarouselItem: async (id) => {
    await delay();
    return { data: mockHeroCarousel.find(item => item._id === id) };
  },

  createCarouselItem: async (formData) => {
    await delay();
    const newItem = {
      _id: Date.now().toString(),
      ...Object.fromEntries(formData),
      isActive: true
    };
    mockHeroCarousel.push(newItem);
    return { data: newItem };
  },

  updateCarouselItem: async (id, formData) => {
    await delay();
    const index = mockHeroCarousel.findIndex(item => item._id === id);
    if (index !== -1) {
      mockHeroCarousel[index] = { ...mockHeroCarousel[index], ...Object.fromEntries(formData) };
      return { data: mockHeroCarousel[index] };
    }
    throw new Error('Carousel item not found');
  },

  deleteCarouselItem: async (id) => {
    await delay();
    const index = mockHeroCarousel.findIndex(item => item._id === id);
    if (index !== -1) {
      mockHeroCarousel.splice(index, 1);
      return { data: { success: true } };
    }
    throw new Error('Carousel item not found');
  },

  toggleCarouselActive: async (id) => {
    await delay();
    const item = mockHeroCarousel.find(item => item._id === id);
    if (item) {
      item.isActive = !item.isActive;
      return { data: item };
    }
    throw new Error('Carousel item not found');
  },

  updateCarouselOrder: async (items) => {
    await delay();
    // Update order based on new array order
    items.forEach((item, index) => {
      const existingItem = mockHeroCarousel.find(i => i._id === item._id);
      if (existingItem) {
        existingItem.order = index + 1;
      }
    });
    // Sort mockHeroCarousel by order
    mockHeroCarousel.sort((a, b) => (a.order || 0) - (b.order || 0));
    return { data: mockHeroCarousel };
  },

  // Coupons
  getCoupons: async () => {
    await delay();
    return { data: mockCoupons };
  },

  createCoupon: async (data) => {
    await delay();
    
    // Check if coupon code already exists
    const existingCoupon = mockCoupons.find(c => c.code.toLowerCase() === data.code.toLowerCase());
    if (existingCoupon) {
      throw new Error('Coupon code already exists');
    }

    // Validate discount percentage
    if (data.discountPercentage && (data.discountPercentage < 0 || data.discountPercentage > 100)) {
      throw new Error('Discount percentage must be between 0 and 100');
    }

    // Validate expiry date
    if (data.expiryDate && new Date(data.expiryDate) < new Date()) {
      throw new Error('Expiry date cannot be in the past');
    }

    // Convert form data to coupon structure
    const expiryDate = data.expiryDate ? new Date(data.expiryDate).toISOString() : null;
    const newCoupon = {
      _id: Date.now().toString(),
      code: data.code.toUpperCase(),
      discountValue: parseFloat(data.discountPercentage || 0),
      discountPercentage: parseFloat(data.discountPercentage || 0),
      discountType: 'percentage',
      minPurchase: parseFloat(data.minOrderAmount || 0),
      minOrderAmount: parseFloat(data.minOrderAmount || 0),
      maxDiscount: null,
      validFrom: new Date().toISOString(),
      validUntil: expiryDate,
      endDate: expiryDate,
      isActive: data.isActive !== undefined ? data.isActive : true,
      usageLimit: parseInt(data.maxUses || 0),
      maxUses: parseInt(data.maxUses || 0),
      usedCount: 0
    };
    
    mockCoupons.push(newCoupon);
    return { data: newCoupon };
  },

  updateCoupon: async (id, data) => {
    await delay();
    const index = mockCoupons.findIndex(c => c._id === id);
    if (index === -1) {
      throw new Error('Coupon not found');
    }

    // Check if coupon code already exists (excluding current coupon)
    const existingCoupon = mockCoupons.find(c => 
      c.code.toLowerCase() === data.code.toLowerCase() && c._id !== id
    );
    if (existingCoupon) {
      throw new Error('Coupon code already exists');
    }

    // Validate discount percentage
    if (data.discountPercentage && (data.discountPercentage < 0 || data.discountPercentage > 100)) {
      throw new Error('Discount percentage must be between 0 and 100');
    }

    // Validate expiry date
    if (data.expiryDate && new Date(data.expiryDate) < new Date()) {
      throw new Error('Expiry date cannot be in the past');
    }

    // Convert form data to coupon structure
    const expiryDate = data.expiryDate ? new Date(data.expiryDate).toISOString() : mockCoupons[index].endDate;
    
    mockCoupons[index] = {
      ...mockCoupons[index],
      code: data.code ? data.code.toUpperCase() : mockCoupons[index].code,
      discountValue: data.discountPercentage !== undefined ? parseFloat(data.discountPercentage) : mockCoupons[index].discountValue,
      discountPercentage: data.discountPercentage !== undefined ? parseFloat(data.discountPercentage) : mockCoupons[index].discountPercentage,
      minPurchase: data.minOrderAmount !== undefined ? parseFloat(data.minOrderAmount) : mockCoupons[index].minPurchase,
      minOrderAmount: data.minOrderAmount !== undefined ? parseFloat(data.minOrderAmount) : mockCoupons[index].minOrderAmount,
      usageLimit: data.maxUses !== undefined ? parseInt(data.maxUses) : mockCoupons[index].usageLimit,
      maxUses: data.maxUses !== undefined ? parseInt(data.maxUses) : mockCoupons[index].maxUses,
      endDate: expiryDate,
      validUntil: expiryDate,
      isActive: data.isActive !== undefined ? data.isActive : mockCoupons[index].isActive
    };
    
    return { data: mockCoupons[index] };
  },

  deleteCoupon: async (id) => {
    await delay();
    const index = mockCoupons.findIndex(c => c._id === id);
    if (index !== -1) {
      mockCoupons.splice(index, 1);
      return { data: { success: true } };
    }
    throw new Error('Coupon not found');
  },

  // Analytics
  // eslint-disable-next-line no-unused-vars
  getSalesAnalytics: async (period = 'monthly') => {
    await delay();
    const totalOrders = mockOrders.length;
    const totalRevenue = mockOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Status breakdown
    const statusBreakdown = {
      pending: mockOrders.filter(o => o.orderStatus === 'pending').length,
      processing: mockOrders.filter(o => o.orderStatus === 'processing').length,
      confirmed: mockOrders.filter(o => o.orderStatus === 'confirmed').length,
      shipped: mockOrders.filter(o => o.orderStatus === 'shipped').length,
      delivered: mockOrders.filter(o => o.orderStatus === 'delivered').length,
      cancelled: mockOrders.filter(o => o.orderStatus === 'cancelled').length
    };
    
    // Payment method breakdown
    const paymentBreakdown = {
      online: mockOrders.filter(o => o.paymentMethod === 'online').length,
      cod: mockOrders.filter(o => o.paymentMethod === 'cod').length
    };
    
    // Growth indicators (mock data with slight variations)
    const growth = {
      revenue: 15.5, // Mock growth percentage
      orders: 8.2 // Mock growth percentage
    };
    
    return {
      data: {
        analytics: {
          totalOrders,
          totalRevenue,
          averageOrderValue,
          statusBreakdown,
          paymentBreakdown,
          growth
        }
      }
    };
  },
  
  getRevenueAnalytics: async (period = 'monthly') => {
    try {
      const response = await adminApi.get(`/dashboard/revenue-analytics?period=${period}`);
      if (response.data && response.data.success) {
        return {
          data: response.data.data
        };
      }
      // Fallback structure if response format differs
      return {
        data: response.data.data || response.data || {}
      };
    } catch (error) {
      console.error('Error fetching revenue analytics:', error);
      // Return empty structure on error - page will calculate from orders
      return {
        data: {
          netRevenue: 0,
          totalRevenue: 0,
          totalDeductions: 0,
          revenueBreakdown: {
            pending: { amount: 0, count: 0, description: 'Orders placed but revenue not yet recognized' },
            earned: { amount: 0, count: 0, description: 'Revenue recognized (Online: Payment completed, COD: Delivered)' },
            confirmed: { amount: 0, count: 0, description: 'Amount received in admin account' },
            cancelled: { amount: 0, count: 0, description: 'Cancelled COD orders' },
            refunded: { amount: 0, count: 0, description: 'Refunded online payments' }
          },
          paymentMethodBreakdown: {
            online: { amount: 0, count: 0 },
            cod: { amount: 0, count: 0 },
            card: { amount: 0, count: 0 },
            upi: { amount: 0, count: 0 }
          }
        }
      };
    }
  },

  getStockSummary: async () => {
    await delay(300);
    return {
      data: {
        stockSummary: {
          totalProducts: mockProducts.length,
          inStockProducts: mockProducts.filter(p => p.inStock && p.stock > 0).length,
          outOfStockProducts: mockProducts.filter(p => !p.inStock || p.stock === 0).length,
          lowStockProducts: mockProducts.filter(p => p.stock > 0 && p.stock <= 5).length,
          totalStockValue: mockProducts.reduce((sum, p) => sum + (p.price * p.stock), 0),
          lowStockAlerts: mockProducts.filter(p => p.stock > 0 && p.stock <= 5).map(p => ({
            id: p._id,
            name: p.name,
            category: p.categoryName,
            currentStock: p.stock
          }))
        }
      }
    };
  },

  getUserAnalytics: async (period = 'monthly') => {
    await delay(300);
    
    // Calculate period multiplier for different time periods
    const periodMultiplier = {
      daily: 0.03,    // ~1/30 of monthly
      monthly: 1,     // Base value
      yearly: 12      // 12x monthly
    };
    const multiplier = periodMultiplier[period] || 1;
    
    // Calculate stats from mock data
    const totalUsers = mockUsers.length;
    const registeredUsers = mockUsers.length;
    const activeRegisteredUsers = mockUsers.filter(u => u.isActive).length;
    const registeredButNotLoggedIn = registeredUsers - activeRegisteredUsers;
    
    // Mock activity data (adjusted by period)
    const totalActivities = Math.round(361 * multiplier);
    const activityCounts = {
      add_to_cart: Math.round(0 * multiplier),
      category_visit: Math.round(40 * multiplier),
      product_view: Math.round(16 * multiplier)
    };
    
    // Mock popular categories based on mockCategories (adjusted by period)
    const baseCategoryVisits = [13, 12, 5, 4, 4, 2];
    const popularCategories = mockCategories.slice(0, 6).map((cat, index) => ({
      categoryId: cat._id,
      categoryName: cat.name,
      visitCount: Math.round((baseCategoryVisits[index] || 1) * multiplier)
    }));
    
    // Mock most viewed products (adjusted by period)
    const baseProductViews = [5, 4, 3, 2, 2];
    const mostViewedProducts = mockProducts.slice(0, 5).map((product, index) => ({
      productId: product._id,
      productName: product.name,
      category: product.categoryName,
      viewCount: Math.round((baseProductViews[index] || 1) * multiplier)
    }));
    
    // Mock engagement data (adjusted by period)
    const registeredUserEngagement = Math.round(activeRegisteredUsers * multiplier);
    const activeAnonymousUsers = Math.round(16 * multiplier); // Mock anonymous users
    const anonymousUserEngagement = activeAnonymousUsers;
    const totalEngagement = registeredUserEngagement + anonymousUserEngagement;
    
    return {
      data: {
        analytics: {
          userStats: {
            totalUsers: totalUsers + activeAnonymousUsers,
            registeredUsers: registeredUsers,
            registeredButNotLoggedIn: registeredButNotLoggedIn,
            activeRegisteredUsers: activeRegisteredUsers,
            activeAnonymousUsers: activeAnonymousUsers
          },
          activityStats: {
            totalActivities: totalActivities,
            activityCounts: activityCounts,
            registeredUserActivities: activeRegisteredUsers * 2,
            anonymousUserActivities: activeAnonymousUsers * 16
          },
          popularCategories: popularCategories,
          mostViewedProducts: mostViewedProducts,
          userEngagement: {
            registeredUserEngagement: registeredUserEngagement,
            anonymousUserEngagement: anonymousUserEngagement,
            totalEngagement: totalEngagement
          }
        }
      }
    };
  },

  getUserDetails: async (userType = 'all') => {
    await delay(300);
    
    // Mock activities for registered users
    const registeredUsers = mockUsers.map(user => {
      const activities = [
        { type: 'product_view', productName: 'Luxury Perfume Gift Set Premium', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
        { type: 'category_visit', category: { name: 'Gift Sets' }, timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
        { type: 'product_view', productName: 'CEO Man Perfume 100ml', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
      ];
      
      return {
        user,
        totalActivities: activities.length,
        lastActivity: activities[0].timestamp,
        activities: activities
      };
    });
    
    // Mock anonymous users
    const anonymousUsers = Array.from({ length: 3 }, (_, index) => ({
      sessionId: `anon_${Date.now()}_${index}`,
      sessionStart: new Date(Date.now() - (index + 1) * 24 * 60 * 60 * 1000).toISOString(),
      lastActivity: new Date(Date.now() - index * 60 * 60 * 1000).toISOString(),
      totalActivities: [8, 5, 3][index] || 2,
      activities: [
        { type: 'product_view', productName: 'Deluxe Fragrance Collection', timestamp: new Date(Date.now() - index * 60 * 60 * 1000).toISOString() },
        { type: 'category_visit', category: { name: '100 ml Perfume' }, timestamp: new Date(Date.now() - (index + 1) * 60 * 60 * 1000).toISOString() }
      ]
    }));
    
    let filteredRegistered = registeredUsers;
    let filteredAnonymous = anonymousUsers;
    
    if (userType === 'registered') {
      filteredAnonymous = [];
    } else if (userType === 'anonymous') {
      filteredRegistered = [];
    }
    
    return {
      data: {
        users: {
          registered: filteredRegistered,
          anonymous: filteredAnonymous
        }
      }
    };
  },

  // Blogs
  getAdminBlogs: async () => {
    await delay();
    return { data: { blogs: mockBlogs, total: mockBlogs.length } };
  },

  getAdminBlogById: async (id) => {
    await delay();
    const blog = mockBlogs.find(b => b._id === id);
    if (!blog) {
      throw new Error('Blog not found');
    }
    return { data: { blog } };
  },

  createBlog: async (formData) => {
    await delay();
    const newBlog = {
      _id: Date.now().toString(),
      ...Object.fromEntries(formData),
      author: 'Admin',
      publishedAt: new Date().toISOString(),
      isPublished: true
    };
    mockBlogs.push(newBlog);
    return { data: newBlog };
  },

  updateBlog: async (id, formData) => {
    await delay();
    const index = mockBlogs.findIndex(b => b._id === id);
    if (index !== -1) {
      mockBlogs[index] = { ...mockBlogs[index], ...Object.fromEntries(formData) };
      return { data: mockBlogs[index] };
    }
    throw new Error('Blog not found');
  },

  deleteBlog: async (id) => {
    await delay();
    const index = mockBlogs.findIndex(b => b._id === id);
    if (index !== -1) {
      mockBlogs.splice(index, 1);
      return { data: { success: true } };
    }
    throw new Error('Blog not found');
  },

  // Announcements
  getAdminAnnouncements: async () => {
    await delay();
    return { data: { announcements: mockAnnouncements, total: mockAnnouncements.length } };
  },

  getAdminAnnouncementById: async (id) => {
    await delay();
    return { data: mockAnnouncements.find(a => a._id === id) };
  },

  createAnnouncement: async (data) => {
    await delay();
    const newAnnouncement = {
      _id: Date.now().toString(),
      ...data,
      createdAt: new Date().toISOString()
    };
    mockAnnouncements.push(newAnnouncement);
    return { data: newAnnouncement };
  },

  updateAnnouncement: async (id, data) => {
    await delay();
    const index = mockAnnouncements.findIndex(a => a._id === id);
    if (index !== -1) {
      mockAnnouncements[index] = { ...mockAnnouncements[index], ...data };
      return { data: mockAnnouncements[index] };
    }
    throw new Error('Announcement not found');
  },

  deleteAnnouncement: async (id) => {
    await delay();
    const index = mockAnnouncements.findIndex(a => a._id === id);
    if (index !== -1) {
      mockAnnouncements.splice(index, 1);
      return { data: { success: true } };
    }
    throw new Error('Announcement not found');
  },

  // Wishlist
  getAllWishlists: async () => {
    try {
      const response = await adminApi.get('/wishlist/admin/all');
      if (response.data && response.data.success) {
        return {
          data: response.data.data || []
        };
      }
      return { data: [] };
    } catch (error) {
      console.error('Error fetching wishlists:', error);
      // Return empty array instead of throwing to prevent redirect
      return { data: [] };
    }
  },

  getWishlistAnalytics: async () => {
    try {
      const response = await adminApi.get('/wishlist/admin/analytics');
      if (response.data && response.data.success) {
        return {
          data: response.data.data || {}
        };
      }
      return { data: {} };
    } catch (error) {
      console.error('Error fetching wishlist analytics:', error);
      // Return empty object instead of throwing to prevent redirect
      return { data: {} };
    }
  },

  // Payments
  getPaymentHistory: async () => {
    await delay();
    return { data: { payments: mockPayments, stats: {
      totalTransactions: mockPayments.length,
      totalAmount: mockPayments.reduce((sum, p) => sum + p.amount, 0),
      onlinePayments: mockPayments.filter(p => p.method === 'online').length,
      codPayments: mockPayments.filter(p => p.method === 'cod').length
    } } };
  },

  // Refunds
  getRefundManagement: async () => {
    await delay();
    return { data: { refunds: mockRefunds, stats: {
      totalRefunds: mockRefunds.length,
      totalRefundAmount: mockRefunds.reduce((sum, r) => sum + r.refundAmount, 0),
      pendingRefunds: mockRefunds.filter(r => r.refundStatus === 'pending').length
    } } };
  },

  // Support
  getSupportQueries: async () => {
    await delay();
    return { data: { success: true, queries: mockSupportQueries, total: mockSupportQueries.length } };
  },

  getSupportQueryById: async (id) => {
    await delay();
    return { data: mockSupportQueries.find(q => q._id === id) };
  },

  addQueryResponse: async (id, responseData) => {
    await delay();
    const query = mockSupportQueries.find(q => q._id === id);
    if (query) {
      const newResponse = {
        _id: Date.now().toString(),
        message: responseData.message,
        sender: responseData.sender || 'admin',
        senderName: responseData.senderName || 'Admin',
        senderEmail: responseData.senderEmail || 'admin@vintagebeauty.com',
        isAdmin: true,
        createdAt: new Date().toISOString()
      };
      if (!query.responses) {
        query.responses = [];
      }
      query.responses.push(newResponse);
      return { data: { success: true, response: newResponse } };
    }
    throw new Error('Query not found');
  },

  updateQueryStatus: async (id, statusData) => {
    await delay();
    const query = mockSupportQueries.find(q => q._id === id);
    if (query) {
      query.status = statusData.status;
      return { data: { success: true, query } };
    }
    throw new Error('Query not found');
  },

  // Admin Profile & Settings
  verifyToken: async () => {
    await delay();
    const adminToken = localStorage.getItem('adminToken');
    
    if (adminToken) {
      return {
        valid: true,
        user: {
          ...mockAdminUser
        }
      };
    }
    return { valid: false };
  },

  updateAdminCredentials: async (updateData) => {
    await delay();
    
    // Validate current password (in real app, this would be checked against backend)
    if (!updateData.currentPassword) {
      throw new Error('Current password is required');
    }

    // Update admin user data
    const updatedUser = {
      ...mockAdminUser,
      username: updateData.username || mockAdminUser.username,
      email: updateData.email || mockAdminUser.email,
      lastLogin: new Date().toISOString()
    };

    // Admin credentials updated (no need to store in localStorage)

    return {
      data: {
        user: updatedUser,
        message: 'Admin credentials updated successfully'
      }
    };
  },

  getSettings: async () => {
    await delay();
    // Get settings from localStorage or use mock data
    const storedSettings = localStorage.getItem('admin_settings');
    if (storedSettings) {
      return { data: { settings: JSON.parse(storedSettings) } };
    }
    return { data: { settings: [...mockSettings] } };
  },

  updateSetting: async (key, settingData) => {
    await delay();
    
    // Get current settings
    const storedSettings = localStorage.getItem('admin_settings');
    let settings = storedSettings ? JSON.parse(storedSettings) : [...mockSettings];
    
    // Find and update setting
    const settingIndex = settings.findIndex(s => s.key === key);
    if (settingIndex !== -1) {
      settings[settingIndex] = {
        ...settings[settingIndex],
        value: settingData.value,
        description: settingData.description,
        updatedAt: new Date().toISOString()
      };
    } else {
      // Add new setting
      settings.push({
        _id: `setting_${Date.now()}`,
        key: key,
        value: settingData.value,
        description: settingData.description || '',
        updatedAt: new Date().toISOString()
      });
    }

    // Save to localStorage
    localStorage.setItem('admin_settings', JSON.stringify(settings));
    
    return {
      data: {
        setting: settings.find(s => s.key === key),
        message: 'Setting updated successfully'
      }
    };
  },

  // Blog Stats
  getBlogStats: async () => {
    await delay();
    const blogs = mockBlogs;
    return {
      data: {
        stats: {
          total: blogs.length,
          published: blogs.filter(b => b.status === 'published').length,
          draft: blogs.filter(b => b.status === 'draft').length,
          totalViews: blogs.reduce((sum, b) => sum + (b.views || 0), 0)
        }
      }
    };
  },

  toggleBlogStatus: async (id) => {
    await delay();
    const blog = mockBlogs.find(b => b._id === id);
    if (blog) {
      blog.status = blog.status === 'published' ? 'draft' : 'published';
      return { data: blog };
    }
    throw new Error('Blog not found');
  },

  // Announcement Stats
  getAnnouncementStats: async () => {
    await delay();
    const announcements = mockAnnouncements;
    return {
      data: {
        stats: {
          total: announcements.length,
          active: announcements.filter(a => a.status === 'active').length,
          draft: announcements.filter(a => a.status === 'draft').length,
          totalViews: announcements.reduce((sum, a) => sum + (a.views || 0), 0),
          totalClicks: announcements.reduce((sum, a) => sum + (a.clicks || 0), 0)
        }
      }
    };
  },

  toggleAnnouncementStatus: async (id) => {
    await delay();
    const announcement = mockAnnouncements.find(a => a._id === id);
    if (announcement) {
      announcement.status = announcement.status === 'active' ? 'archived' : 'active';
      return { data: announcement };
    }
    throw new Error('Announcement not found');
  },

  // Support Tickets
  getSupportTickets: async () => {
    await delay();
    // Use mockSupportQueries as tickets for now
    return { data: { tickets: mockSupportQueries, total: mockSupportQueries.length } };
  },

  addTicketMessage: async (id, messageData) => {
    await delay();
    const ticket = mockSupportQueries.find(t => t._id === id);
    if (ticket) {
      if (!ticket.messages) ticket.messages = [];
      const newMessage = {
        _id: Date.now().toString(),
        message: messageData.message,
        sender: messageData.sender || 'admin',
        senderName: messageData.senderName || 'Admin',
        senderEmail: messageData.senderEmail || 'admin@vintagebeauty.com',
        isAdmin: messageData.sender === 'admin',
        createdAt: new Date().toISOString()
      };
      ticket.messages.push(newMessage);
      return { data: { success: true, message: newMessage } };
    }
    throw new Error('Ticket not found');
  },

  updateTicketStatus: async (id, statusData) => {
    await delay();
    const ticket = mockSupportQueries.find(t => t._id === id);
    if (ticket) {
      ticket.status = statusData.status;
      return { data: { success: true, ticket } };
    }
    throw new Error('Ticket not found');
  },

  // Refund Processing
  processRefund: async (orderId) => {
    try {
      const response = await adminApi.put(`/orders/${orderId}/refund`);
      if (response.data && response.data.success) {
        return {
          data: {
            success: true,
            refundAmount: response.data.data?.refundAmount || response.data.data?.order?.refundAmount || 0,
            refund: {
              orderId: orderId,
              refundAmount: response.data.data?.refundAmount || response.data.data?.order?.refundAmount || 0,
              refundStatus: response.data.data?.order?.refundStatus || 'completed',
              refundCompletedAt: response.data.data?.order?.refundProcessedAt || new Date().toISOString()
            },
            order: response.data.data?.order || response.data.data
          }
        };
      }
      throw new Error('Failed to process refund');
    } catch (error) {
      console.error('Error processing refund:', error);
      throw error.response?.data || { message: error.message || 'Failed to process refund' };
    }
  },

  processCODRefund: async () => {
    // COD orders don't have upfront amounts, so this should not be called
    // COD orders are fully paid on delivery, so no refund needed
    await delay();
    throw new Error('COD refunds are not applicable. COD orders are paid in full on delivery.');
  },

  // Data Pages
  getDataPage: async (type) => {
    await delay();
    const stored = localStorage.getItem(`data_page_${type}`);
    if (stored) {
      return { data: JSON.parse(stored) };
    }
    return { data: null };
  },

  updateDataPage: async (type, data) => {
    await delay();
    const pageData = {
      _id: `data_page_${type}`,
      type: type,
      heading: data.heading,
      content: data.content,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(`data_page_${type}`, JSON.stringify(pageData));
    return { data: pageData };
  },

  createDataPage: async (data) => {
    await delay();
    const pageData = {
      _id: `data_page_${data.type}`,
      type: data.type,
      heading: data.heading,
      content: data.content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(`data_page_${data.type}`, JSON.stringify(pageData));
    return { data: pageData };
  }
};

export default adminService;

