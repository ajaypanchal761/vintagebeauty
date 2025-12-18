const Order = require('../model/Order');
const Product = require('../model/Product');
const User = require('../model/User');

// Helper function to get date range based on period
const getDateRange = (period) => {
  const now = new Date();
  let startDate;

  switch (period) {
    case 'daily':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'weekly':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      break;
    case 'monthly':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'quarterly':
      const currentQuarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
      break;
    case 'yearly':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return { startDate, endDate: now };
};

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private/Admin
exports.getDashboardStats = async (req, res, next) => {
  try {
    // Get all products
    const totalProducts = await Product.countDocuments();
    const featuredProducts = await Product.countDocuments({ isFeatured: true });
    const bestSellers = await Product.countDocuments({ isBestSeller: true });
    const mostLoved = await Product.countDocuments({ isMostLoved: true });

    // Get user statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: { $ne: false } });
    // Note: User model doesn't have googleId field, so all users are regular users
    const googleUsers = 0; // Will be 0 until googleId field is added to User model
    const regularUsers = totalUsers;

    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        featuredProducts,
        bestSellers,
        mostLoved,
        totalUsers,
        activeUsers,
        googleUsers,
        regularUsers
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get sales analytics
// @route   GET /api/dashboard/sales-analytics
// @access  Private/Admin
exports.getSalesAnalytics = async (req, res, next) => {
  try {
    const { period = 'monthly' } = req.query;
    const { startDate, endDate } = getDateRange(period);

    // Get orders for the period
    const orders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate }
    });

    // Get previous period orders for comparison
    const previousStartDate = new Date(startDate);
    const previousEndDate = new Date(startDate);
    
    if (period === 'daily') {
      previousStartDate.setDate(previousStartDate.getDate() - 1);
      previousEndDate.setDate(previousEndDate.getDate() - 1);
    } else if (period === 'monthly') {
      previousStartDate.setMonth(previousStartDate.getMonth() - 1);
      previousEndDate.setMonth(previousEndDate.getMonth() - 1);
    } else if (period === 'yearly') {
      previousStartDate.setFullYear(previousStartDate.getFullYear() - 1);
      previousEndDate.setFullYear(previousEndDate.getFullYear() - 1);
    }

    const previousOrders = await Order.find({
      createdAt: { $gte: previousStartDate, $lte: previousEndDate }
    });

    // Calculate current period stats
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate previous period stats
    const previousTotalOrders = previousOrders.length;
    const previousTotalRevenue = previousOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
    const previousAverageOrderValue = previousTotalOrders > 0 ? previousTotalRevenue / previousTotalOrders : 0;

    // Calculate growth percentages
    const ordersGrowth = previousTotalOrders > 0 
      ? ((totalOrders - previousTotalOrders) / previousTotalOrders) * 100 
      : (totalOrders > 0 ? 100 : 0);
    const revenueGrowth = previousTotalRevenue > 0 
      ? ((totalRevenue - previousTotalRevenue) / previousTotalRevenue) * 100 
      : (totalRevenue > 0 ? 100 : 0);

    // Order status breakdown
    const statusBreakdown = {
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0
    };

    orders.forEach(order => {
      const status = order.orderStatus?.toLowerCase() || 'pending';
      if (statusBreakdown.hasOwnProperty(status)) {
        statusBreakdown[status]++;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        analytics: {
          totalOrders,
          totalRevenue,
          averageOrderValue,
          statusBreakdown,
          growth: {
            orders: ordersGrowth,
            revenue: revenueGrowth
          }
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get stock summary
// @route   GET /api/dashboard/stock-summary
// @access  Private/Admin
exports.getStockSummary = async (req, res, next) => {
  try {
    const products = await Product.find().select('name stock price categoryName');

    let inStockProducts = 0;
    let outOfStockProducts = 0;
    let lowStockProducts = 0;
    let totalStockValue = 0;
    const lowStockAlerts = [];

    products.forEach(product => {
      const stock = product.stock || 0;
      const price = product.price || product.sizes?.[0]?.price || 0;
      const stockValue = stock * price;
      totalStockValue += stockValue;

      if (stock === 0) {
        outOfStockProducts++;
      } else if (stock > 0 && stock <= 10) {
        lowStockProducts++;
        lowStockAlerts.push({
          id: product._id.toString(),
          name: product.name,
          category: product.categoryName || 'Uncategorized',
          currentStock: stock
        });
      } else {
        inStockProducts++;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        stockSummary: {
          totalProducts: products.length,
          inStockProducts,
          outOfStockProducts,
          lowStockProducts,
          totalStockValue,
          lowStockAlerts: lowStockAlerts.sort((a, b) => a.currentStock - b.currentStock)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get revenue analytics
// @route   GET /api/dashboard/revenue-analytics
// @access  Private/Admin
exports.getRevenueAnalytics = async (req, res, next) => {
  try {
    const { period = 'monthly' } = req.query;
    const { startDate, endDate } = getDateRange(period);

    // Get orders for the period
    const orders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate }
    });

    // Calculate revenue breakdown
    const revenueBreakdown = {
      pending: { amount: 0, count: 0, description: 'Orders placed but revenue not yet recognized' },
      earned: { amount: 0, count: 0, description: 'Revenue recognized (Online: Payment completed, COD: Delivered)' },
      confirmed: { amount: 0, count: 0, description: 'Amount received in admin account' },
      cancelled: { amount: 0, count: 0, description: 'Cancelled COD orders' },
      refunded: { amount: 0, count: 0, description: 'Refunded online payments' }
    };

    let netRevenue = 0;
    let totalRevenue = 0;
    let totalDeductions = 0;

    orders.forEach(order => {
      const orderAmount = order.totalPrice || 0;
      totalRevenue += orderAmount;

      // Categorize revenue based on order status and payment method
      if (order.orderStatus === 'cancelled') {
        if (order.paymentMethod === 'cod') {
          revenueBreakdown.cancelled.amount += orderAmount;
          revenueBreakdown.cancelled.count++;
          totalDeductions += orderAmount;
        } else if (order.refundStatus === 'processed' || order.refundStatus === 'approved' || order.refundStatus === 'completed') {
          revenueBreakdown.refunded.amount += orderAmount;
          revenueBreakdown.refunded.count++;
          totalDeductions += orderAmount;
        }
      } else if (order.refundStatus && order.refundStatus !== 'none' && order.refundStatus !== 'rejected' && 
                 (order.refundStatus === 'processed' || order.refundStatus === 'approved' || order.refundStatus === 'completed')) {
        // Handle refunds for non-cancelled orders (if any)
        const refundAmount = order.refundAmount || orderAmount;
        revenueBreakdown.refunded.amount += refundAmount;
        revenueBreakdown.refunded.count++;
        totalDeductions += refundAmount;
      } else if (order.orderStatus === 'delivered') {
        if (order.paymentMethod === 'cod') {
          revenueBreakdown.earned.amount += orderAmount;
          revenueBreakdown.earned.count++;
          if (order.revenueStatus === 'confirmed') {
            revenueBreakdown.confirmed.amount += orderAmount;
            revenueBreakdown.confirmed.count++;
            netRevenue += orderAmount;
          }
        } else if (order.paymentStatus === 'completed') {
          revenueBreakdown.confirmed.amount += orderAmount;
          revenueBreakdown.confirmed.count++;
          netRevenue += orderAmount;
        }
      } else if (order.paymentMethod === 'online' && order.paymentStatus === 'completed') {
        if (order.orderStatus === 'confirmed' || order.orderStatus === 'processing') {
          revenueBreakdown.confirmed.amount += orderAmount;
          revenueBreakdown.confirmed.count++;
          netRevenue += orderAmount;
        } else {
          revenueBreakdown.pending.amount += orderAmount;
          revenueBreakdown.pending.count++;
        }
      } else {
        revenueBreakdown.pending.amount += orderAmount;
        revenueBreakdown.pending.count++;
      }
    });

    // Payment method breakdown
    const paymentMethodBreakdown = {
      cod: { amount: 0, count: 0 },
      online: { amount: 0, count: 0 },
      card: { amount: 0, count: 0 },
      upi: { amount: 0, count: 0 }
    };

    orders.forEach(order => {
      const method = order.paymentMethod || 'cod';
      if (paymentMethodBreakdown[method]) {
        paymentMethodBreakdown[method].amount += order.totalPrice || 0;
        paymentMethodBreakdown[method].count++;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        netRevenue,
        totalRevenue,
        totalDeductions,
        revenueBreakdown,
        paymentMethodBreakdown
      }
    });
  } catch (error) {
    next(error);
  }
};

