const User = require('../model/User');
const UserActivity = require('../model/UserActivity');
const Product = require('../model/Product');
const Category = require('../model/Category');
const Order = require('../model/Order');

// Helper function to get date range based on period
const getDateRange = (period) => {
  const now = new Date();
  let startDate;

  switch (period) {
    case 'daily':
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'monthly':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'yearly':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return { startDate, endDate: now };
};

// @desc    Get user analytics (Admin)
// @route   GET /api/user-analytics
// @access  Private/Admin
exports.getUserAnalytics = async (req, res, next) => {
  try {
    const { period = 'monthly' } = req.query;
    const { startDate, endDate } = getDateRange(period);

    // Get all users
    const allUsers = await User.find();
    const registeredUsers = allUsers.filter(u => u.email || u.name).length;
    
    // Get users who have logged in (have password set or have made orders)
    const usersWithOrders = await Order.distinct('user');
    const activeRegisteredUsers = usersWithOrders.length;
    const registeredButNotLoggedIn = registeredUsers - activeRegisteredUsers;

    // Get activities for the period
    const activities = await UserActivity.find({
      createdAt: { $gte: startDate, $lte: endDate }
    }).populate('productId', 'name categoryName').populate('categoryId', 'name');

    // Calculate activity statistics
    const activityCounts = {
      add_to_cart: 0,
      category_visit: 0,
      product_view: 0,
      search: 0,
      page_view: 0,
      checkout_start: 0,
      checkout_complete: 0
    };

    let registeredUserActivities = 0;
    let anonymousUserActivities = 0;

    activities.forEach(activity => {
      const type = activity.activityType;
      if (activityCounts.hasOwnProperty(type)) {
        activityCounts[type]++;
      }

      if (activity.userId) {
        registeredUserActivities++;
      } else {
        anonymousUserActivities++;
      }
    });

    // Get unique registered users who have activities
    const registeredUserIds = [...new Set(activities.filter(a => a.userId).map(a => a.userId.toString()))];
    const activeRegisteredUsersWithActivities = registeredUserIds.length;

    // Get unique anonymous sessions
    const anonymousSessions = [...new Set(activities.filter(a => !a.userId).map(a => a.sessionId).filter(Boolean))];
    const activeAnonymousUsers = anonymousSessions.length;
    
    // Total users = registered users + active anonymous users
    const totalUsers = registeredUsers + activeAnonymousUsers;

    // Calculate popular categories
    const categoryVisits = {};
    activities.forEach(activity => {
      if (activity.activityType === 'category_visit') {
        const categoryId = activity.categoryId?._id?.toString() || activity.categoryId?.toString();
        const categoryName = activity.categoryName || activity.categoryId?.name || 'Unknown';
        
        if (categoryId) {
          if (!categoryVisits[categoryId]) {
            categoryVisits[categoryId] = {
              categoryId,
              categoryName,
              visitCount: 0
            };
          }
          categoryVisits[categoryId].visitCount++;
        }
      }
    });

    const popularCategories = Object.values(categoryVisits)
      .sort((a, b) => b.visitCount - a.visitCount)
      .slice(0, 10);

    // Calculate most viewed products
    const productViews = {};
    activities.forEach(activity => {
      if (activity.activityType === 'product_view') {
        const productId = activity.productId?._id?.toString() || activity.productId?.toString();
        const productName = activity.productName || activity.productId?.name || 'Unknown';
        const categoryName = activity.categoryName || activity.productId?.categoryName || 'Unknown';
        
        if (productId) {
          if (!productViews[productId]) {
            productViews[productId] = {
              productId,
              productName,
              category: categoryName,
              viewCount: 0
            };
          }
          productViews[productId].viewCount++;
        }
      }
    });

    const mostViewedProducts = Object.values(productViews)
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 10);

    // Calculate user engagement
    const registeredUserEngagement = activeRegisteredUsersWithActivities;
    const anonymousUserEngagement = activeAnonymousUsers;
    const totalEngagement = registeredUserEngagement + anonymousUserEngagement;

    const analytics = {
      userStats: {
        totalUsers,
        registeredUsers,
        registeredButNotLoggedIn,
        activeRegisteredUsers: activeRegisteredUsersWithActivities,
        activeAnonymousUsers
      },
      activityStats: {
        totalActivities: activities.length,
        activityCounts,
        registeredUserActivities,
        anonymousUserActivities
      },
      popularCategories,
      mostViewedProducts,
      userEngagement: {
        registeredUserEngagement,
        anonymousUserEngagement,
        totalEngagement
      }
    };

    res.status(200).json({
      success: true,
      data: {
        analytics,
        period
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user details by type (Admin)
// @route   GET /api/user-analytics/users/:type
// @access  Private/Admin
exports.getUserDetails = async (req, res, next) => {
  try {
    const { type = 'all' } = req.params;
    const { period = 'monthly' } = req.query;
    const { startDate, endDate } = getDateRange(period);

    let registeredUsers = [];
    let anonymousUsers = [];

    if (type === 'all' || type === 'registered') {
      // Get registered users with their activities
      const users = await User.find();
      const activities = await UserActivity.find({
        userId: { $in: users.map(u => u._id) },
        createdAt: { $gte: startDate, $lte: endDate }
      }).populate('productId', 'name').populate('categoryId', 'name').sort({ createdAt: -1 });

      // Group activities by user
      const userActivityMap = {};
      activities.forEach(activity => {
        const userId = activity.userId.toString();
        if (!userActivityMap[userId]) {
          userActivityMap[userId] = {
            user: users.find(u => u._id.toString() === userId),
            activities: [],
            totalActivities: 0,
            lastActivity: null
          };
        }
        userActivityMap[userId].activities.push({
          type: activity.activityType,
          productName: activity.productName || activity.productId?.name,
          category: activity.categoryId,
          searchQuery: activity.searchQuery,
          timestamp: activity.createdAt
        });
        userActivityMap[userId].totalActivities++;
        if (!userActivityMap[userId].lastActivity || activity.createdAt > userActivityMap[userId].lastActivity) {
          userActivityMap[userId].lastActivity = activity.createdAt;
        }
      });

      registeredUsers = Object.values(userActivityMap);
    }

    if (type === 'all' || type === 'anonymous') {
      // Get anonymous user sessions with their activities
      const activities = await UserActivity.find({
        userId: null,
        createdAt: { $gte: startDate, $lte: endDate }
      }).populate('productId', 'name').populate('categoryId', 'name').sort({ createdAt: -1 });

      // Group activities by session
      const sessionActivityMap = {};
      activities.forEach(activity => {
        const sessionId = activity.sessionId || 'unknown';
        if (!sessionActivityMap[sessionId]) {
          sessionActivityMap[sessionId] = {
            sessionId,
            activities: [],
            totalActivities: 0,
            sessionStart: activity.createdAt,
            lastActivity: activity.createdAt
          };
        }
        sessionActivityMap[sessionId].activities.push({
          type: activity.activityType,
          productName: activity.productName || activity.productId?.name,
          category: activity.categoryId,
          searchQuery: activity.searchQuery,
          timestamp: activity.createdAt
        });
        sessionActivityMap[sessionId].totalActivities++;
        if (activity.createdAt < sessionActivityMap[sessionId].sessionStart) {
          sessionActivityMap[sessionId].sessionStart = activity.createdAt;
        }
        if (activity.createdAt > sessionActivityMap[sessionId].lastActivity) {
          sessionActivityMap[sessionId].lastActivity = activity.createdAt;
        }
      });

      anonymousUsers = Object.values(sessionActivityMap);
    }

    res.status(200).json({
      success: true,
      data: {
        users: {
          registered: registeredUsers,
          anonymous: anonymousUsers
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Track user activity (Public)
// @route   POST /api/user-analytics/track
// @access  Public
exports.trackActivity = async (req, res, next) => {
  try {
    const { 
      userId, 
      sessionId, 
      activityType, 
      productId, 
      categoryId, 
      categoryName,
      productName,
      searchQuery,
      pageUrl,
      metadata 
    } = req.body;

    if (!activityType) {
      return res.status(400).json({
        success: false,
        message: 'Activity type is required'
      });
    }

    // Generate sessionId if not provided and no userId
    let finalSessionId = sessionId;
    if (!userId && !sessionId) {
      finalSessionId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    const activity = await UserActivity.create({
      userId: userId || null,
      sessionId: finalSessionId,
      activityType,
      productId: productId || null,
      categoryId: categoryId || null,
      categoryName,
      productName,
      searchQuery,
      pageUrl,
      metadata: metadata || {}
    });

    res.status(201).json({
      success: true,
      message: 'Activity tracked successfully',
      data: {
        activity,
        sessionId: finalSessionId
      }
    });
  } catch (error) {
    next(error);
  }
};

