import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Users, 
  AlertTriangle,
  Calendar,
  BarChart3,
  PieChart,
  RefreshCw
} from 'lucide-react';
import dashboardService from '../../../services/dashboardService';
import productService from '../../../services/productService';
import userService from '../../../services/userService';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    featuredProducts: 0,
    bestSellers: 0,
    mostLoved: 0,
    totalOrders: 0,
    totalUsers: 0,
    activeUsers: 0,
    googleUsers: 0,
    regularUsers: 0
  });
  
  const [salesAnalytics, setSalesAnalytics] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    statusBreakdown: {},
    paymentBreakdown: {},
    growth: { revenue: 0, orders: 0 }
  });
  
  const [stockSummary, setStockSummary] = useState({
    totalProducts: 0,
    inStockProducts: 0,
    outOfStockProducts: 0,
    lowStockProducts: 0,
    totalStockValue: 0,
    lowStockAlerts: [],
    categoryBreakdown: {}
  });
  
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [revenueAnalytics, setRevenueAnalytics] = useState({
    netRevenue: 0,
    totalRevenue: 0,
    totalDeductions: 0,
    revenueBreakdown: {},
    paymentMethodBreakdown: {}
  });
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchSalesAnalytics();
    fetchStockSummary();
    fetchRevenueAnalytics();
  }, [selectedPeriod]);

  // Refresh function
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchSalesAnalytics(),
        fetchStockSummary(),
        fetchRevenueAnalytics()
      ]);
    } catch (err) {
      console.error('Error refreshing dashboard:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch dashboard statistics from backend
      const statsResponse = await dashboardService.getStats();
      const statsData = statsResponse.data.stats;

      // Fetch product counts
      const allProducts = await productService.getProducts();
      const featured = await productService.getProductsBySection('featured');
      const bestSellers = await productService.getProductsBySection('bestsellers');
      const mostLoved = await productService.getProductsBySection('mostloved');

      setStats({
        totalProducts: statsData.totalProducts || allProducts.data?.length || 0,
        featuredProducts: statsData.featuredProducts || featured.data?.length || 0,
        bestSellers: statsData.bestSellers || bestSellers.data?.length || 0,
        mostLoved: statsData.mostLoved || mostLoved.data?.length || 0,
        totalOrders: 0, // Will be set from sales analytics
        totalUsers: statsData.totalUsers || 0,
        activeUsers: statsData.activeUsers || 0,
        googleUsers: statsData.googleUsers || 0,
        regularUsers: statsData.regularUsers || 0
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError(err.message || 'Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesAnalytics = useCallback(async () => {
    try {
      const response = await dashboardService.getSalesAnalytics(selectedPeriod);
      setSalesAnalytics(response.data.analytics);
      // Update total orders in stats
      setStats(prev => ({
        ...prev,
        totalOrders: response.data.analytics.totalOrders || 0
      }));
    } catch (err) {
      console.error('Error fetching sales analytics:', err);
    }
  }, [selectedPeriod]);

  const fetchStockSummary = async () => {
    try {
      const response = await dashboardService.getStockSummary();
      setStockSummary(response.data.stockSummary);
    } catch (err) {
      console.error('Error fetching stock summary:', err);
    }
  };

  const fetchRevenueAnalytics = useCallback(async () => {
    try {
      const response = await dashboardService.getRevenueAnalytics(selectedPeriod);
      setRevenueAnalytics(response.data);
    } catch (err) {
      console.error('Error fetching revenue analytics:', err);
    }
  }, [selectedPeriod]);

  const StatCard = ({ title, value, linkTo }) => (
    <Link 
      to={linkTo}
      className="bg-white p-3 md:p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
    >
      <h3 className="text-sm md:text-lg font-semibold text-gray-700 truncate">{title}</h3>
      <p className="text-xl md:text-3xl font-bold text-blue-600 mt-1 md:mt-2">{value}</p>
    </Link>
  );

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen bg-gray-100">
        <div className="text-xl text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen bg-gray-100">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  // Helper function to format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Helper function to format percentage
  const formatPercentage = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  // Helper component for growth indicator
  const GrowthIndicator = ({ value, label }) => {
    const isPositive = value >= 0;
    return (
      <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
        <span>{formatPercentage(value)}</span>
        <span className="text-gray-500">{label}</span>
      </div>
    );
  };

  return (
    <div className="p-2 md:p-6 space-y-3 md:space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 md:gap-0">
        <h1 className="text-xl md:text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        
        {/* Period Selector and Refresh Button */}
        <div className="flex gap-1 md:gap-2 items-center flex-wrap">
          {['daily', 'monthly', 'yearly'].map(period => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-2 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                selectedPeriod === period
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
          
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="px-2 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 md:gap-2 shadow-lg border border-green-800"
            title="Refresh Dashboard"
          >
            <RefreshCw 
              size={16} 
              className={refreshing ? 'animate-spin' : ''} 
            />
            <span className="font-semibold hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Sales Overview Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-3 md:p-6"
      >
        <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-6">
          <BarChart3 className="text-blue-600" size={20} />
          <h2 className="text-lg md:text-2xl font-bold text-gray-800">Sales Overview ({selectedPeriod})</h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-6 mb-3 md:mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-2 md:p-4 text-white cursor-pointer" onClick={() => setShowRevenueModal(true)}>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-blue-100 text-xs md:text-sm truncate">Net Revenue</p>
                <p className="text-lg md:text-2xl font-bold truncate">{formatCurrency(revenueAnalytics.netRevenue)}</p>
                <p className="text-blue-100 text-[10px] md:text-xs hidden md:block">Click to view breakdown</p>
              </div>
              <DollarSign size={20} className="text-blue-200 md:w-8 md:h-8 flex-shrink-0 ml-1" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-2 md:p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-green-100 text-xs md:text-sm truncate">Total Orders</p>
                <p className="text-lg md:text-2xl font-bold">{salesAnalytics.totalOrders}</p>
                <div className="hidden md:block">
                  <GrowthIndicator value={salesAnalytics.growth.orders} label="vs previous" />
                </div>
              </div>
              <ShoppingCart size={20} className="text-green-200 md:w-8 md:h-8 flex-shrink-0 ml-1" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-2 md:p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-purple-100 text-xs md:text-sm truncate">Avg Order Value</p>
                <p className="text-lg md:text-2xl font-bold truncate">{formatCurrency(salesAnalytics.averageOrderValue)}</p>
              </div>
              <Package size={20} className="text-purple-200 md:w-8 md:h-8 flex-shrink-0 ml-1" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-2 md:p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-orange-100 text-xs md:text-sm truncate">Total Users</p>
                <p className="text-lg md:text-2xl font-bold">{stats.totalUsers}</p>
              </div>
              <Users size={20} className="text-orange-200 md:w-8 md:h-8 flex-shrink-0 ml-1" />
            </div>
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4">
          {Object.entries(salesAnalytics.statusBreakdown || {}).map(([status, count]) => (
            <div key={status} className="bg-gray-50 rounded-lg p-2 md:p-4 text-center">
              <p className="text-xs md:text-sm text-gray-600 capitalize truncate">{status}</p>
              <p className="text-base md:text-xl font-bold text-gray-800">{count}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Stock Summary Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm p-3 md:p-6"
      >
        <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-6">
          <Package className="text-green-600" size={20} />
          <h2 className="text-lg md:text-2xl font-bold text-gray-800">Stock Summary</h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-6 mb-3 md:mb-6">
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-2 md:p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-green-100 text-xs md:text-sm truncate">In Stock</p>
                <p className="text-lg md:text-2xl font-bold">{stockSummary.inStockProducts}</p>
              </div>
              <Package size={20} className="text-green-200 md:w-8 md:h-8 flex-shrink-0 ml-1" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-2 md:p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-red-100 text-xs md:text-sm truncate">Out of Stock</p>
                <p className="text-lg md:text-2xl font-bold">{stockSummary.outOfStockProducts}</p>
              </div>
              <AlertTriangle size={20} className="text-red-200 md:w-8 md:h-8 flex-shrink-0 ml-1" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-2 md:p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-yellow-100 text-xs md:text-sm truncate">Low Stock</p>
                <p className="text-lg md:text-2xl font-bold">{stockSummary.lowStockProducts}</p>
              </div>
              <AlertTriangle size={20} className="text-yellow-200 md:w-8 md:h-8 flex-shrink-0 ml-1" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg p-2 md:p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-indigo-100 text-xs md:text-sm truncate">Stock Value</p>
                <p className="text-lg md:text-2xl font-bold truncate">{formatCurrency(stockSummary.totalStockValue)}</p>
              </div>
              <DollarSign size={20} className="text-indigo-200 md:w-8 md:h-8 flex-shrink-0 ml-1" />
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        {stockSummary.lowStockAlerts && stockSummary.lowStockAlerts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-2 md:p-4">
            <div className="flex items-center gap-2 mb-2 md:mb-3">
              <AlertTriangle className="text-red-600" size={16} />
              <h3 className="text-base md:text-lg font-semibold text-red-800">Low Stock Alerts</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
              {stockSummary.lowStockAlerts.slice(0, 6).map((product) => (
                <div key={product.id} className="bg-white rounded-lg p-2 md:p-3 border border-red-200">
                  <p className="font-medium text-gray-800 truncate text-sm md:text-base">{product.name}</p>
                  <p className="text-xs md:text-sm text-gray-600 truncate">{product.category}</p>
                  <p className="text-xs md:text-sm font-semibold text-red-600">Stock: {product.currentStock}</p>
                </div>
              ))}
            </div>
            {stockSummary.lowStockAlerts.length > 6 && (
              <p className="text-xs md:text-sm text-red-600 mt-2">
                +{stockSummary.lowStockAlerts.length - 6} more products with low stock
              </p>
            )}
          </div>
        )}
      </motion.div>

      {/* Product Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-6">
        <StatCard 
          title="Total Products" 
          value={stats.totalProducts}
          linkTo="/admin/products"
        />
        <StatCard 
          title="Featured Products" 
          value={stats.featuredProducts}
          linkTo="/admin/products?section=featured"
        />
        <StatCard 
          title="Best Sellers" 
          value={stats.bestSellers}
          linkTo="/admin/products?section=bestsellers"
        />
        <StatCard 
          title="Most Loved" 
          value={stats.mostLoved}
          linkTo="/admin/products?section=mostloved"
        />
      </div>

      {/* User Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-6">
        <StatCard 
          title="Active Users" 
          value={stats.activeUsers}
          linkTo="/admin/users?filter=active"
        />
        <StatCard 
          title="Google Users" 
          value={stats.googleUsers}
          linkTo="/admin/users?filter=google"
        />
        <StatCard 
          title="Regular Users" 
          value={stats.regularUsers}
          linkTo="/admin/users?filter=regular"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-3 md:p-6">
        <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-3 md:mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
          <Link to="/admin/products/new" className="bg-blue-600 text-white px-2 md:px-4 py-2 md:py-3 rounded-lg hover:bg-blue-700 transition-colors text-center text-xs md:text-base">
            Add New Product
          </Link>
          <Link to="/admin/orders" className="bg-green-600 text-white px-2 md:px-4 py-2 md:py-3 rounded-lg hover:bg-green-700 transition-colors text-center text-xs md:text-base">
            View Orders
          </Link>
          <Link to="/admin/users" className="bg-purple-600 text-white px-2 md:px-4 py-2 md:py-3 rounded-lg hover:bg-purple-700 transition-colors text-center text-xs md:text-base">
            Manage Users
          </Link>
          <Link to="/admin/categories" className="bg-orange-600 text-white px-2 md:px-4 py-2 md:py-3 rounded-lg hover:bg-orange-700 transition-colors text-center text-xs md:text-base">
            Manage Categories
          </Link>
        </div>
      </div>

      {/* Revenue Breakdown Modal */}
      {showRevenueModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowRevenueModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Revenue Breakdown</h3>
              <button
                onClick={() => setShowRevenueModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Key Revenue Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Package className="text-yellow-600 mr-2" size={20} />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Pending Revenue</p>
                      <p className="text-lg font-bold text-yellow-900">₹{revenueAnalytics.revenueBreakdown?.pending?.amount || 0}</p>
                      <p className="text-xs text-yellow-700">{revenueAnalytics.revenueBreakdown?.pending?.count || 0} Orders</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <ShoppingCart className="text-green-600 mr-2" size={20} />
                    <div>
                      <p className="text-sm font-medium text-green-800">Earned Revenue</p>
                      <p className="text-lg font-bold text-green-900">₹{revenueAnalytics.revenueBreakdown?.earned?.amount || 0}</p>
                      <p className="text-xs text-green-700">{revenueAnalytics.revenueBreakdown?.earned?.count || 0} Orders</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <DollarSign className="text-blue-600 mr-2" size={20} />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Confirmed Revenue</p>
                      <p className="text-lg font-bold text-blue-900">₹{revenueAnalytics.revenueBreakdown?.confirmed?.amount || 0}</p>
                      <p className="text-xs text-blue-700">{revenueAnalytics.revenueBreakdown?.confirmed?.count || 0} Orders</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Revenue Status Explanation */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3">Revenue Status Explanation:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                    <span><strong>Pending:</strong> {revenueAnalytics.revenueBreakdown?.pending?.description || 'Orders placed but revenue not yet recognized'}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span><strong>Earned:</strong> {revenueAnalytics.revenueBreakdown?.earned?.description || 'Revenue recognized (Online: Payment completed, COD: Delivered)'}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    <span><strong>Confirmed:</strong> {revenueAnalytics.revenueBreakdown?.confirmed?.description || 'Amount received in admin account'}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method Rules */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-3">Payment Method Rules:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• <strong>Online Payment:</strong> Revenue confirmed automatically when payment completed</li>
                  <li>• <strong>Cash on Delivery (COD):</strong> Revenue earned when delivered, confirmed manually by admin</li>
                  <li>• <strong>Revenue Amount:</strong> Full order amount (no deductions)</li>
                </ul>
              </div>

              {/* Deductions Section */}
              {((revenueAnalytics.revenueBreakdown?.cancelled?.amount > 0) || (revenueAnalytics.revenueBreakdown?.refunded?.amount > 0)) && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-800 mb-3">Revenue Deductions:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {revenueAnalytics.revenueBreakdown?.cancelled?.amount > 0 && (
                      <div>
                        <p className="text-sm text-red-700">Cancelled COD Orders:</p>
                        <p className="font-bold text-red-900">₹{revenueAnalytics.revenueBreakdown.cancelled.amount}</p>
                        <p className="text-xs text-red-600">{revenueAnalytics.revenueBreakdown.cancelled.count} orders</p>
                      </div>
                    )}
                    {revenueAnalytics.revenueBreakdown?.refunded?.amount > 0 && (
                      <div>
                        <p className="text-sm text-red-700">Refunded Online Payments:</p>
                        <p className="font-bold text-red-900">₹{revenueAnalytics.revenueBreakdown.refunded.amount}</p>
                        <p className="text-xs text-red-600">{revenueAnalytics.revenueBreakdown.refunded.count} orders</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
