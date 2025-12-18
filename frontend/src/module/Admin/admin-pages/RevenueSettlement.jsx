import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Calendar,
  BarChart3,
  CreditCard,
  Banknote,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  FileText,
  Calculator,
  Target
} from 'lucide-react';
import adminService from '../admin-services/adminService';

function toIST(dateString) {
  return new Date(dateString).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
}

const RevenueSettlement = () => {
  const [revenueData, setRevenueData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  
  // Statistics
  const [stats, setStats] = useState({
    totalRevenue: 0,
    netRevenue: 0,
    totalDeductions: 0,
    pendingRevenue: 0,
    earnedRevenue: 0,
    confirmedRevenue: 0,
    cancelledRevenue: 0,
    refundedRevenue: 0,
    onlineRevenue: 0,
    codRevenue: 0,
    averageOrderValue: 0,
    totalOrders: 0
  });

  useEffect(() => {
    fetchRevenueData();
  }, [selectedPeriod]);

  useEffect(() => {
    calculateStats();
  }, [revenueData, orders]);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch orders for detailed analysis
      const ordersResponse = await adminService.getOrders();
      if (ordersResponse.data.orders) {
        setOrders(ordersResponse.data.orders);
      }
      
      // Fetch revenue analytics from backend API
      try {
        const revenueResponse = await adminService.getRevenueAnalytics(selectedPeriod);
        if (revenueResponse.data) {
          setRevenueData(revenueResponse.data);
        }
      } catch (revenueErr) {
        console.warn('Revenue analytics not available, calculating from orders:', revenueErr);
        setRevenueData(null);
        // Will calculate from orders in calculateStats
      }
    } catch (err) {
      console.error('Error fetching revenue data:', err);
      setError('Failed to fetch revenue data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    // If we have revenue data from API, use it; otherwise calculate from orders
    if (revenueData && revenueData.revenueBreakdown) {
      const breakdown = revenueData.revenueBreakdown;
      const paymentBreakdown = revenueData.paymentMethodBreakdown || {};
      
      // Use API data for revenue breakdown
      const stats = {
        totalRevenue: revenueData.totalRevenue || 0,
        netRevenue: revenueData.netRevenue || 0,
        totalDeductions: revenueData.totalDeductions || 0,
        pendingRevenue: breakdown.pending?.amount || 0,
        earnedRevenue: breakdown.earned?.amount || 0,
        confirmedRevenue: breakdown.confirmed?.amount || 0,
        cancelledRevenue: breakdown.cancelled?.amount || 0,
        refundedRevenue: breakdown.refunded?.amount || 0,
        onlineRevenue: (paymentBreakdown.online?.amount || 0) + (paymentBreakdown.card?.amount || 0) + (paymentBreakdown.upi?.amount || 0),
        codRevenue: paymentBreakdown.cod?.amount || 0,
        averageOrderValue: 0,
        totalOrders: orders.length
      };

      // Calculate average order value from orders
      if (orders.length > 0) {
        const totalOrderValue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
        stats.averageOrderValue = totalOrderValue / orders.length;
      }

      setStats(stats);
      return;
    }

    // Fallback: Calculate from orders if API data not available
    if (!orders || orders.length === 0) {
      setStats({
        totalRevenue: 0,
        netRevenue: 0,
        totalDeductions: 0,
        pendingRevenue: 0,
        earnedRevenue: 0,
        confirmedRevenue: 0,
        cancelledRevenue: 0,
        refundedRevenue: 0,
        onlineRevenue: 0,
        codRevenue: 0,
        averageOrderValue: 0,
        totalOrders: 0
      });
      return;
    }

    const stats = {
      totalRevenue: 0,
      netRevenue: 0,
      totalDeductions: 0,
      pendingRevenue: 0,
      earnedRevenue: 0,
      confirmedRevenue: 0,
      cancelledRevenue: 0,
      refundedRevenue: 0,
      onlineRevenue: 0,
      codRevenue: 0,
      averageOrderValue: 0,
      totalOrders: orders.length
    };

    // Calculate revenue breakdown
    orders.forEach(order => {
      const amount = order.totalPrice || 0;
      stats.totalRevenue += amount;

      // Payment method breakdown
      if (order.paymentMethod === 'online' || order.paymentMethod === 'card' || order.paymentMethod === 'upi') {
        stats.onlineRevenue += amount;
      } else if (order.paymentMethod === 'cod') {
        stats.codRevenue += amount;
      }

      // Revenue status breakdown - prioritize revenueStatus field if available
      if (order.revenueStatus) {
        if (order.revenueStatus === 'earned') {
          stats.earnedRevenue += amount;
        } else if (order.revenueStatus === 'confirmed') {
          stats.confirmedRevenue += amount;
          stats.earnedRevenue += amount; // Confirmed is also earned
        } else if (order.revenueStatus === 'pending') {
          stats.pendingRevenue += amount;
        }
      } else {
        // Fallback: calculate from order status and payment status
        if (order.orderStatus === 'delivered') {
          if (order.paymentMethod === 'cod') {
            stats.earnedRevenue += amount;
            if (order.revenueStatus === 'confirmed') {
              stats.confirmedRevenue += amount;
            }
          } else if (order.paymentStatus === 'completed') {
            stats.earnedRevenue += amount;
            stats.confirmedRevenue += amount;
          }
        } else if (order.orderStatus === 'confirmed' && order.paymentStatus === 'completed') {
          stats.confirmedRevenue += amount;
          stats.earnedRevenue += amount;
        } else if (order.orderStatus === 'pending' || order.orderStatus === 'processing') {
          stats.pendingRevenue += amount;
        }
      }
      
      // Handle cancelled orders separately (regardless of revenueStatus)
      if (order.orderStatus === 'cancelled') {
        if (order.paymentMethod === 'cod') {
          stats.cancelledRevenue += amount;
          stats.totalDeductions += amount;
        }
      }

      // Refunded revenue - check for processed, approved, or completed refunds
      if (order.refundStatus && 
          order.refundStatus !== 'none' && 
          order.refundStatus !== 'rejected' &&
          (order.refundStatus === 'processed' || order.refundStatus === 'approved' || order.refundStatus === 'completed')) {
        const refundAmount = order.refundAmount || order.totalPrice || 0;
        stats.refundedRevenue += refundAmount;
        stats.totalDeductions += refundAmount;
      }
    });

    stats.netRevenue = stats.totalRevenue - stats.totalDeductions;

    // Calculate average order value
    if (orders.length > 0) {
      const totalOrderValue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
      stats.averageOrderValue = totalOrderValue / orders.length;
    }

    setStats(stats);
  };

  const exportRevenueReport = () => {
    const headers = [
      'Period',
      'Total Revenue',
      'Net Revenue',
      'Total Deductions',
      'Pending Revenue',
      'Earned Revenue',
      'Confirmed Revenue',
      'Cancelled Revenue',
      'Refunded Revenue',
      'Online Revenue',
      'COD Revenue',
      'Total Orders',
      'Average Order Value'
    ];

    const csvData = [
      [
        selectedPeriod,
        stats.totalRevenue,
        stats.netRevenue,
        stats.totalDeductions,
        stats.pendingRevenue,
        stats.earnedRevenue,
        stats.confirmedRevenue,
        stats.cancelledRevenue,
        stats.refundedRevenue,
        stats.onlineRevenue,
        stats.codRevenue,
        stats.totalOrders,
        stats.averageOrderValue
      ]
    ];

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `revenue-settlement-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Revenue Report & Settlement</h1>
          <p className="text-gray-600">Comprehensive revenue analytics and settlement tracking</p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
          <button
            onClick={fetchRevenueData}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={exportRevenueReport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Main Revenue Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₹{stats.totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Net Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₹{stats.netRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Deductions</p>
              <p className="text-2xl font-bold text-gray-900">₹{stats.totalDeductions.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calculator className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Average Order Value</p>
              <p className="text-2xl font-bold text-gray-900">₹{stats.averageOrderValue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Status Breakdown</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Pending</span>
              </div>
              <span className="text-sm font-bold text-gray-900">₹{stats.pendingRevenue.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg mr-3">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Earned</span>
              </div>
              <span className="text-sm font-bold text-gray-900">₹{stats.earnedRevenue.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Confirmed</span>
              </div>
              <span className="text-sm font-bold text-gray-900">₹{stats.confirmedRevenue.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg mr-3">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Cancelled</span>
              </div>
              <span className="text-sm font-bold text-gray-900">₹{stats.cancelledRevenue.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg mr-3">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Refunded</span>
              </div>
              <span className="text-sm font-bold text-gray-900">₹{stats.refundedRevenue.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method Breakdown</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg mr-3">
                  <CreditCard className="h-5 w-5 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Online Payments</span>
              </div>
              <span className="text-sm font-bold text-gray-900">₹{stats.onlineRevenue.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg mr-3">
                  <Banknote className="h-5 w-5 text-orange-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Cash on Delivery</span>
              </div>
              <span className="text-sm font-bold text-gray-900">₹{stats.codRevenue.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Order Statistics</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Orders</span>
                <span className="text-sm font-medium text-gray-900">{stats.totalOrders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Average Order Value</span>
                <span className="text-sm font-medium text-gray-900">₹{stats.averageOrderValue.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Rules and Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Management Rules</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">Online Payment Rules</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Revenue confirmed automatically when payment completed</li>
                <li>• No manual confirmation required</li>
                <li>• Refunds deducted from total revenue</li>
                <li>• Cancellations handled through refund process</li>
              </ul>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2">COD Payment Rules</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Revenue earned when order delivered</li>
                <li>• Manual confirmation required by admin</li>
                <li>• Upfront amounts refunded separately</li>
                <li>• Full amount confirmed on delivery</li>
              </ul>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="bg-yellow-50 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-2">Revenue Status Definitions</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• <strong>Pending:</strong> Order placed, revenue not recognized</li>
                <li>• <strong>Earned:</strong> Revenue recognized (payment/delivery)</li>
                <li>• <strong>Confirmed:</strong> Amount received in admin account</li>
                <li>• <strong>Cancelled:</strong> Order cancelled, revenue deducted</li>
                <li>• <strong>Refunded:</strong> Refund processed, revenue deducted</li>
              </ul>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2">Settlement Process</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Daily revenue reconciliation</li>
                <li>• Weekly settlement reports</li>
                <li>• Monthly financial summaries</li>
                <li>• Quarterly performance analysis</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="p-3 bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
              <Target className="h-8 w-8 text-green-600" />
            </div>
            <h4 className="font-semibold text-gray-900">Revenue Efficiency</h4>
            <p className="text-2xl font-bold text-green-600">
              {stats.totalRevenue > 0 ? ((stats.netRevenue / stats.totalRevenue) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-sm text-gray-500">Net vs Total Revenue</p>
          </div>
          
          <div className="text-center">
            <div className="p-3 bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
            <h4 className="font-semibold text-gray-900">Confirmation Rate</h4>
            <p className="text-2xl font-bold text-blue-600">
              {stats.totalRevenue > 0 ? ((stats.confirmedRevenue / stats.totalRevenue) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-sm text-gray-500">Confirmed Revenue</p>
          </div>
          
          <div className="text-center">
            <div className="p-3 bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
              <Calculator className="h-8 w-8 text-purple-600" />
            </div>
            <h4 className="font-semibold text-gray-900">Average Order Value</h4>
            <p className="text-2xl font-bold text-purple-600">₹{stats.averageOrderValue.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Per Order</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueSettlement;
