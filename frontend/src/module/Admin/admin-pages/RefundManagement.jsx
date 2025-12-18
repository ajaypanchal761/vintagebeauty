import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Download, 
  Search, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  DollarSign,
  CreditCard,
  Banknote,
  TrendingDown,
  FileText
} from 'lucide-react';
import orderService from '../../../services/orderService';

function toIST(dateString) {
  return new Date(dateString).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
}

const RefundManagement = () => {
  const [refunds, setRefunds] = useState([]);
  const [filteredRefunds, setFilteredRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [processingRefund, setProcessingRefund] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Statistics
  const [stats, setStats] = useState({
    totalRefunds: 0,
    totalRefundAmount: 0,
    pendingRefunds: 0,
    processingRefunds: 0,
    completedRefunds: 0,
    failedRefunds: 0,
    onlineRefunds: 0,
    codRefunds: 0
  });

  useEffect(() => {
    fetchRefundData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [refunds, searchTerm, statusFilter, paymentMethodFilter, dateRange, startDate, endDate]);

  const fetchRefundData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get refunds from orders using real API
      const ordersResponse = await orderService.getAllOrders();
      const orders = ordersResponse.data.orders || [];
      
      // Filter orders that have refund information OR cancellation requests
      // Include orders with:
      // 1. refundStatus !== 'none' (refunds)
      // 2. cancellationStatus === 'requested' or 'approved' (pending cancellation requests that may need refunds)
      // 3. cancellationReason exists (fallback to catch any cancellation requests even if status is missing)
      const refundRecords = orders
        .filter(order => {
          const hasRefund = order.refundStatus && order.refundStatus !== 'none';
          const cancellationStatus = (order.cancellationStatus || '').toLowerCase();
          const hasCancellationRequest = cancellationStatus === 'requested' || cancellationStatus === 'approved';
          // Fallback: if cancellationReason exists but status is missing/empty, include it
          const hasCancellationReason = order.cancellationReason && order.cancellationReason.trim().length > 0;
          const needsCancellationReview = hasCancellationReason && (cancellationStatus === '' || cancellationStatus === 'none');
          return hasRefund || hasCancellationRequest || needsCancellationReview;
        })
        .map(order => {
          // Get user information from populated user field
          const user = order.user || {};
          const customerName = user.name || order.shippingAddress?.name || 'Unknown';
          const customerEmail = user.email || '';
          
          // Get order amount
          const orderAmount = order.totalPrice || 0;
          
          // Determine refund amount and status
          // If cancellation is requested/approved but refundStatus is 'none', handle based on payment method
          let refundAmount = order.refundAmount || 0;
          let refundStatus = order.refundStatus || 'none';
          
          // If cancellation is requested/approved but refund not yet processed
          if ((order.cancellationStatus === 'requested' || order.cancellationStatus === 'approved') && 
              refundStatus === 'none') {
            // For online payments that are completed, refund is needed
            if (order.paymentMethod === 'online' && order.paymentStatus === 'completed') {
              refundStatus = 'pending';
              refundAmount = orderAmount; // Set refund amount to order total
            }
            // For COD orders, no refund is needed (payment not yet received)
            // But we still show them in the list for tracking purposes
            // They will have refundStatus = 'none' and refundAmount = 0
          }
          
          return {
            id: order._id,
            orderId: order._id || order.orderNumber,
            customerName: customerName,
            customerEmail: customerEmail,
            paymentMethod: order.paymentMethod,
            orderAmount: orderAmount,
            refundAmount: refundAmount,
            refundStatus: refundStatus,
            refundTransactionId: order.razorpay?.paymentId || null,
            refundInitiatedAt: order.refundProcessedAt || (order.cancelledAt || order.createdAt),
            refundCompletedAt: order.refundStatus === 'completed' ? (order.refundProcessedAt || order.updatedAt) : null,
            refundFailedReason: null, // Not in current model
            cancellationReason: order.cancellationReason,
            cancellationRequestedAt: (order.cancellationStatus === 'requested' || order.cancellationStatus === 'approved') ? (order.cancellationRequestedAt || order.createdAt) : null,
            cancellationApprovedAt: order.cancelledAt,
            cancellationApprovedBy: order.cancellationApprovedBy,
            cancellationStatus: order.cancellationStatus,
            orderStatus: order.orderStatus,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt
          };
        })
        .sort((a, b) => new Date(b.refundInitiatedAt || b.createdAt) - new Date(a.refundInitiatedAt || a.createdAt));
        
      setRefunds(refundRecords);
      calculateStats(refundRecords);
    } catch (err) {
      console.error('Error fetching refund data:', err);
      setError('Failed to fetch refund data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (refundRecords) => {
    const stats = {
      totalRefunds: refundRecords.length,
      totalRefundAmount: 0,
      pendingRefunds: 0,
      processingRefunds: 0,
      completedRefunds: 0,
      failedRefunds: 0,
      onlineRefunds: 0,
      codRefunds: 0
    };

    refundRecords.forEach(refund => {
      stats.totalRefundAmount += refund.refundAmount || 0;
      
      if (refund.paymentMethod === 'online') {
        stats.onlineRefunds++;
      } else if (refund.paymentMethod === 'cod') {
        stats.codRefunds++;
      }
      
      switch (refund.refundStatus) {
        case 'pending':
          stats.pendingRefunds++;
          break;
        case 'processing':
          stats.processingRefunds++;
          break;
        case 'completed':
          stats.completedRefunds++;
          break;
        case 'failed':
          stats.failedRefunds++;
          break;
      }
    });

    setStats(stats);
  };

  const applyFilters = () => {
    let filtered = [...refunds];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(refund =>
        refund.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        refund.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        refund.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (refund.refundTransactionId && refund.refundTransactionId.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(refund => refund.refundStatus === statusFilter);
    }

    // Payment method filter
    if (paymentMethodFilter !== 'all') {
      filtered = filtered.filter(refund => refund.paymentMethod === paymentMethodFilter);
    }

    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      let startDate = new Date();
      
      switch (dateRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        case 'custom':
          if (startDate && endDate) {
            const customStart = new Date(startDate);
            const customEnd = new Date(endDate);
            customEnd.setHours(23, 59, 59, 999);
            filtered = filtered.filter(refund => {
              const refundDate = new Date(refund.refundInitiatedAt || refund.createdAt);
              return refundDate >= customStart && refundDate <= customEnd;
            });
          }
          break;
      }
      
      if (dateRange !== 'custom') {
        filtered = filtered.filter(refund => new Date(refund.refundInitiatedAt || refund.createdAt) >= startDate);
      }
    }

    setFilteredRefunds(filtered);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getPaymentMethodIcon = (method) => {
    return method === 'online' ? 
      <CreditCard className="h-4 w-4" /> : 
      <Banknote className="h-4 w-4" />;
  };

  const processRefund = async (orderId) => {
    if (!window.confirm('Are you sure you want to process this refund? This action cannot be undone.')) {
      return;
    }

    try {
      setProcessingRefund(true);
      setError(null);
      setSuccess(null);

      await orderService.processRefund(orderId);
      setSuccess('Refund processed successfully!');
      await fetchRefundData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error processing refund:', err);
      setError(err.message || 'Failed to process refund');
    } finally {
      setProcessingRefund(false);
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Order ID',
      'Customer Name',
      'Customer Email',
      'Payment Method',
      'Order Amount',
      'Refund Amount',
      'Refund Status',
      'Refund Transaction ID',
      'Refund Initiated At',
      'Refund Completed At',
      'Cancellation Reason'
    ];

    const csvData = filteredRefunds.map(refund => [
      refund.orderId,
      refund.customerName,
      refund.customerEmail,
      refund.paymentMethod,
      refund.orderAmount,
      refund.refundAmount,
      refund.refundStatus,
      refund.refundTransactionId || 'N/A',
      refund.refundInitiatedAt ? toIST(refund.refundInitiatedAt) : 'N/A',
      refund.refundCompletedAt ? toIST(refund.refundCompletedAt) : 'N/A',
      refund.cancellationReason || 'N/A'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `refund-management-${new Date().toISOString().split('T')[0]}.csv`;
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
          <h1 className="text-2xl font-bold text-gray-900">Refund Management</h1>
          <p className="text-gray-600">Manage and track all refund transactions</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchRefundData}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{success}</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <XCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Refunds</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalRefunds}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Refund Amount</p>
              <p className="text-2xl font-bold text-gray-900">₹{stats.totalRefundAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Refunds</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingRefunds}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed Refunds</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completedRefunds}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search refunds..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Refund Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="all">All Methods</option>
              <option value="online">Online Payment</option>
              <option value="cod">Cash on Delivery</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last 3 Months</option>
              <option value="year">Last Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {dateRange === 'custom' && (
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Custom Date Range</label>
              <div className="space-y-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Refund Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Refund Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRefunds.map((refund) => (
                <tr key={refund.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        {getPaymentMethodIcon(refund.paymentMethod)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          Order: {refund.orderId}
                        </div>
                        <div className="text-sm text-gray-500">
                          {refund.paymentMethod === 'online' ? 'Online Payment' : 'Cash on Delivery'}
                        </div>
                        {refund.cancellationStatus === 'requested' && (
                          <div className="text-xs text-orange-600 font-medium">
                            ⚠️ Cancellation Requested
                          </div>
                        )}
                        {refund.cancellationStatus === 'approved' && refund.refundStatus === 'pending' && (
                          <div className="text-xs text-yellow-600 font-medium">
                            ✓ Cancellation Approved - Refund Pending
                          </div>
                        )}
                        {refund.refundTransactionId && (
                          <div className="text-xs text-gray-400">
                            TXN: {refund.refundTransactionId}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {refund.customerName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {refund.customerEmail}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ₹{refund.refundAmount?.toLocaleString() || 0}
                    </div>
                    <div className="text-xs text-gray-500">
                      Order: ₹{refund.orderAmount?.toLocaleString() || 0}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(refund.refundStatus)}`}>
                      {getStatusIcon(refund.refundStatus)}
                      <span className="ml-1 capitalize">{refund.refundStatus}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {refund.refundInitiatedAt ? toIST(refund.refundInitiatedAt) : toIST(refund.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedRefund(refund);
                          setShowDetailsModal(true);
                        }}
                        className="text-pink-600 hover:text-pink-900 flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </button>
                      {refund.refundStatus === 'pending' && (
                        <button
                          onClick={() => processRefund(refund.orderId)}
                          disabled={processingRefund}
                          className="text-green-600 hover:text-green-900 flex items-center gap-1 disabled:opacity-50"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Process
                        </button>
                      )}
                      {refund.cancellationStatus === 'requested' && refund.refundStatus === 'none' && refund.paymentMethod === 'online' && (
                        <span className="text-xs text-gray-500 italic">
                          Approve cancellation first
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRefunds.length === 0 && (
          <div className="text-center py-12">
            <RefreshCw className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No refunds found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' || paymentMethodFilter !== 'all' || dateRange !== 'all'
                ? 'Try adjusting your filters to see more results.'
                : 'No refund transactions have been recorded yet.'}
            </p>
          </div>
        )}
      </div>

      {/* Refund Details Modal */}
      {showDetailsModal && selectedRefund && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Refund Details</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Refund Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Refund Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Order ID</label>
                      <p className="text-sm text-gray-900">{selectedRefund.orderId}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Refund Amount</label>
                      <p className="text-sm text-gray-900">₹{selectedRefund.refundAmount?.toLocaleString() || 0}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Refund Status</label>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedRefund.refundStatus)}`}>
                        {getStatusIcon(selectedRefund.refundStatus)}
                        <span className="ml-1 capitalize">{selectedRefund.refundStatus}</span>
                      </span>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Payment Method</label>
                      <p className="text-sm text-gray-900 capitalize">{selectedRefund.paymentMethod}</p>
                    </div>
                    {selectedRefund.refundTransactionId && (
                      <div className="col-span-2">
                        <label className="text-sm font-medium text-gray-500">Refund Transaction ID</label>
                        <p className="text-sm text-gray-900">{selectedRefund.refundTransactionId}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Customer Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Name</label>
                      <p className="text-sm text-gray-900">{selectedRefund.customerName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-sm text-gray-900">{selectedRefund.customerEmail}</p>
                    </div>
                  </div>
                </div>

                {/* Cancellation Information */}
                {selectedRefund.cancellationReason && (
                  <div className="bg-red-50 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Cancellation Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Cancellation Reason</label>
                        <p className="text-sm text-gray-900">{selectedRefund.cancellationReason}</p>
                      </div>
                      {selectedRefund.cancellationRequestedAt && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Requested At</label>
                          <p className="text-sm text-gray-900">{toIST(selectedRefund.cancellationRequestedAt)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                {selectedRefund.refundStatus === 'pending' && (
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Actions</h3>
                    <button
                      onClick={() => {
                        processRefund(selectedRefund.orderId);
                        setShowDetailsModal(false);
                      }}
                      disabled={processingRefund}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {processingRefund ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Process Refund
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RefundManagement;
