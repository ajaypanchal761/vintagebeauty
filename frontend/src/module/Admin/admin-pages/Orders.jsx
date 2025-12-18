import React, { useState, useEffect } from 'react';
import orderService from '../../../services/orderService';
import socketService from '../../../services/socketService';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

function toIST(dateString) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
}

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingOrder, setUpdatingOrder] = useState(null);
  const [stateFilter, setStateFilter] = useState([]);
  const [showStateFilter, setShowStateFilter] = useState(false);
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [cancellationAction, setCancellationAction] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingRefund, setProcessingRefund] = useState(false);
  const [confirmingCOD, setConfirmingCOD] = useState(false);
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [selectedOrderForRevenue, setSelectedOrderForRevenue] = useState(null);
  
  // Indian states list
  const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
    "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi",
    "Jammu and Kashmir", "Ladakh", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
    "Lakshadweep", "Puducherry", "Andaman and Nicobar Islands"
  ];

  useEffect(() => {
    fetchOrders();
  }, []);

  // Socket.IO setup for real-time order status updates
  useEffect(() => {
    // Connect to Socket.IO
    socketService.connect();

    // Set up order status update listener
    const handleOrderStatusUpdate = (data) => {
      const { orderId, orderStatus, trackingHistory } = data;
      
      setOrders(prevOrders => {
        return prevOrders.map(order => {
          if (order._id === orderId) {
            // Update order status and tracking history
            return {
              ...order,
              orderStatus: orderStatus,
              trackingHistory: trackingHistory || order.trackingHistory
            };
          }
          return order;
        });
      });

      // Update filtered orders
      setFilteredOrders(prevFiltered => {
        return prevFiltered.map(order => {
          if (order._id === orderId) {
            return {
              ...order,
              orderStatus: orderStatus,
              trackingHistory: trackingHistory || order.trackingHistory
            };
          }
          return order;
        });
      });

      // Update selectedOrder if it's the one being updated
      setSelectedOrder(prevSelected => {
        if (prevSelected && prevSelected._id === orderId) {
          return {
            ...prevSelected,
            orderStatus: orderStatus,
            trackingHistory: trackingHistory || prevSelected.trackingHistory
          };
        }
        return prevSelected;
      });
    };

    socketService.onOrderStatusUpdate(handleOrderStatusUpdate);

    // Join order rooms for all orders
    orders.forEach(order => {
      if (order._id) {
        socketService.joinOrderRoom(order._id);
      }
    });

    // Cleanup on unmount
    return () => {
      socketService.offOrderStatusUpdate(handleOrderStatusUpdate);
      // Leave all order rooms
      orders.forEach(order => {
        if (order._id) {
          socketService.leaveOrderRoom(order._id);
        }
      });
    };
  }, [orders]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await orderService.getAllOrders();
      const ordersData = response.data.orders || response.data || [];
      
      // Map backend order structure to frontend expected structure
      const mappedOrders = ordersData.map(order => {
        const shippingAddress = order.shippingAddress || {};
        return {
          ...order,
          items: order.orderItems || [],
          customerName: order.user?.name || shippingAddress?.name || 'Unknown',
          email: order.user?.email || '',
          phone: order.user?.phone || shippingAddress?.phone || '',
          totalAmount: order.totalPrice || 0,
          address: shippingAddress ? {
            ...shippingAddress,
            street: shippingAddress.address || shippingAddress.street || ''
          } : {},
          state: shippingAddress?.state || '',
          cancellationRequested: order.cancellationStatus && order.cancellationStatus !== 'none',
          orderId: order.orderNumber || order._id
        };
      });
      
      setOrders(mappedOrders);
      setFilteredOrders(mappedOrders);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch orders');
      setLoading(false);
    }
  };

  // Filter orders by multiple states
  const handleStateFilterChange = (selectedStates) => {
    setStateFilter(selectedStates);
    if (selectedStates.length === 0 && cancellationFilter === 'all') {
      setFilteredOrders(orders);
    } else {
      let filtered = orders;
      
      // Apply state filter
      if (selectedStates.length > 0) {
        filtered = filtered.filter(order => {
          const orderState = order.state || (order.address && order.address.state);
          return selectedStates.includes(orderState);
        });
      }
      
      // Apply cancellation filter
      if (cancellationFilter !== 'all') {
        filtered = filtered.filter(order => {
          if (cancellationFilter === 'cancellation_requested') {
            return order.cancellationStatus === 'requested';
          } else if (cancellationFilter === 'cancelled') {
            return order.cancellationStatus === 'approved';
          } else if (cancellationFilter === 'cancellation_rejected') {
            return order.cancellationStatus === 'rejected';
          } else if (cancellationFilter === 'no_cancellation') {
            return !order.cancellationRequested || order.cancellationStatus === 'none';
          }
          return true;
        });
      }
      
      setFilteredOrders(filtered);
    }
  };

  // Filter orders by cancellation status
  const [cancellationFilter, setCancellationFilter] = useState('all');
  
  const handleCancellationFilterChange = (filter) => {
    setCancellationFilter(filter);
    if (filter === 'all' && stateFilter.length === 0) {
      setFilteredOrders(orders);
    } else {
      let filtered = orders;
      
      // Apply cancellation filter
      if (filter !== 'all') {
        filtered = filtered.filter(order => {
          if (filter === 'cancellation_requested') {
            return order.cancellationStatus === 'requested';
          } else if (filter === 'cancelled') {
            return order.cancellationStatus === 'approved';
          } else if (filter === 'cancellation_rejected') {
            return order.cancellationStatus === 'rejected';
          } else if (filter === 'no_cancellation') {
            return !order.cancellationRequested || order.cancellationStatus === 'none';
          }
          return true;
        });
      }
      
      // Apply state filter
      if (stateFilter.length > 0) {
        filtered = filtered.filter(order => {
          const orderState = order.state || (order.address && order.address.state);
          return stateFilter.includes(orderState);
        });
      }
      
      setFilteredOrders(filtered);
    }
  };

  const toggleStateFilter = (state) => {
    const newFilter = stateFilter.includes(state)
      ? stateFilter.filter(s => s !== state)
      : [...stateFilter, state];
    handleStateFilterChange(newFilter);
  };

  const clearAllFilters = () => {
    setStateFilter([]);
    setCancellationFilter('all');
    setFilteredOrders(orders);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setUpdatingOrder(orderId);
      setError(null);
      setSuccess(null);
      
      // Find the order to check if it's cancelled
      const order = orders.find(o => o._id === orderId);
      if (order && order.cancellationStatus === 'approved') {
        setError('Cannot update status of cancelled orders. Order has been cancelled and cannot be modified.');
        setTimeout(() => setError(null), 5000);
        setUpdatingOrder(null);
        return;
      }
      
      const response = await orderService.updateOrderStatus(orderId, newStatus);
      
      setSuccess(`Order status updated to ${newStatus} successfully!`);
      
      // Refresh orders list
      await fetchOrders();
      
      // Update selectedOrder if it's currently open to show latest tracking history
      if (selectedOrder && selectedOrder._id === orderId) {
        const updatedOrder = response.data || response.data?.data;
        if (updatedOrder) {
          // Map the updated order to match the expected structure
          const shippingAddress = updatedOrder.shippingAddress || {};
          const mappedOrder = {
            ...updatedOrder,
            items: updatedOrder.orderItems || [],
            customerName: updatedOrder.user?.name || shippingAddress?.name || 'Unknown',
            email: updatedOrder.user?.email || '',
            phone: updatedOrder.user?.phone || shippingAddress?.phone || '',
            totalAmount: updatedOrder.totalPrice || 0,
            address: shippingAddress ? {
              ...shippingAddress,
              street: shippingAddress.address || shippingAddress.street || ''
            } : {},
            state: shippingAddress?.state || '',
            cancellationRequested: updatedOrder.cancellationStatus && updatedOrder.cancellationStatus !== 'none',
            orderId: updatedOrder.orderNumber || updatedOrder._id
          };
          setSelectedOrder(mappedOrder);
        }
      }
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update order status');
      setTimeout(() => setError(null), 5000);
    } finally {
      setUpdatingOrder(null);
    }
  };

  const handleCancellationRequest = async (orderId, action) => {
    try {
      setUpdatingOrder(orderId);
      setError(null);
      setSuccess(null);
      
      const reasonForRejection = action === 'reject' ? rejectionReason : undefined;
      await orderService.handleCancellationRequest(orderId, action, reasonForRejection);
      
      setSuccess(`Cancellation request ${action}d successfully!`);
      
      setShowCancellationModal(false);
      setCancellationAction(null);
      setRejectionReason('');
      
      setTimeout(() => {
        setSelectedOrder(null);
      }, 300);
      
      setTimeout(() => {
        fetchOrders();
      }, 500);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action} cancellation request`);
      setTimeout(() => setError(null), 5000);
    } finally {
      setUpdatingOrder(null);
    }
  };

  const openCancellationModal = (action) => {
    setCancellationAction(action);
    setShowCancellationModal(true);
    setRejectionReason('');
  };

  const processRefund = async (orderId) => {
    if (!window.confirm('Are you sure you want to process refund for this order? The amount will be refunded to customer\'s original payment method.')) {
      return;
    }

    try {
      setProcessingRefund(true);
      setError(null);
      setSuccess(null);

      const response = await orderService.processRefund(orderId);

      const refundAmount = response.data?.refundAmount || response.data?.data?.refundAmount || response.data?.data?.order?.refundAmount || response.data?.order?.totalPrice || 0;
      setSuccess(`✅ Refund processed successfully! Amount ₹${refundAmount} will be credited to customer within 5-7 business days. This amount has been deducted from total revenue.`);
      
      setTimeout(() => {
        setSelectedOrder(null);
      }, 300);
      
      setTimeout(() => {
        fetchOrders();
      }, 500);
      
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('Refund error:', err);
      setError(err.response?.data?.message || 'Failed to process refund. Please try again.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setProcessingRefund(false);
    }
  };

  const confirmCODReceipt = async (orderId) => {
    const order = orders.find(o => o._id === orderId);
    if (!order) return;

    const defaultAmount = order.totalAmount;
    const amount = window.prompt(`Confirm COD payment receipt for Order #${order.orderId || orderId}\n\nEnter received amount:`, defaultAmount);
    
    if (amount === null) return;
    
    const confirmedAmount = parseFloat(amount);
    if (isNaN(confirmedAmount) || confirmedAmount <= 0) {
      setError('Please enter a valid amount');
      setTimeout(() => setError(null), 3000);
      return;
    }

    try {
      setConfirmingCOD(true);
      setError(null);
      setSuccess(null);

      const response = await orderService.confirmCODReceipt(orderId, confirmedAmount);

      setSuccess(`COD payment confirmed successfully! Amount ₹${confirmedAmount} added to revenue.`);
      await fetchOrders();
    } catch (error) {
      console.error('Error confirming COD payment:', error);
      setError(error.response?.data?.message || 'Error confirming COD payment');
    } finally {
      setConfirmingCOD(false);
    }
  };

  const handleConfirmRevenue = async () => {
    if (!selectedOrderForRevenue) {
      setError('No order selected for revenue confirmation');
      return;
    }

    setConfirmingCOD(true);
    try {
      const confirmedAmount = selectedOrderForRevenue.revenueAmount || selectedOrderForRevenue.totalAmount;
      await orderService.confirmCODReceipt(selectedOrderForRevenue._id, confirmedAmount);
      setSuccess('Revenue confirmed successfully');
      setShowRevenueModal(false);
      setSelectedOrderForRevenue(null);
      fetchOrders();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to confirm revenue');
    } finally {
      setConfirmingCOD(false);
    }
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    manufacturing: 'bg-purple-100 text-purple-800',
    shipped: 'bg-indigo-100 text-indigo-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  const paymentStatusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    paid: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800'
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );

  if (error && !orders.length) return (
    <div className="text-red-600 text-center p-4">
      Error: {error}
    </div>
  );

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <h1 className="text-2xl font-bold mb-6">Orders Management</h1>

      {/* Success Message */}
      {success && (
        <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded flex items-center space-x-2">
          <CheckCircle className="w-5 h-5" />
          <span>{success}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center space-x-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Section */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div className="flex-1">
            {/* Cancellation Status Filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Cancellation Status
              </label>
              <select
                value={cancellationFilter}
                onChange={(e) => handleCancellationFilterChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Orders</option>
                <option value="no_cancellation">No Cancellation</option>
                <option value="cancellation_requested">Cancellation Requested</option>
                <option value="cancelled">Cancelled Orders</option>
                <option value="cancellation_rejected">Cancellation Rejected</option>
              </select>
            </div>

            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Filter by State
              </label>
              <button
                onClick={() => setShowStateFilter(!showStateFilter)}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                {showStateFilter ? 'Hide' : 'Show'} States
              </button>
            </div>
            
            {showStateFilter && (
              <div className="border border-gray-300 rounded-md p-3 bg-gray-50 max-h-60 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {indianStates.map((state) => (
                    <label key={state} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={stateFilter.includes(state)}
                        onChange={() => toggleStateFilter(state)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700">{state}</span>
                    </label>
                  ))}
                </div>
                {(stateFilter.length > 0 || cancellationFilter !== 'all') && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <button
                      onClick={clearAllFilters}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Clear All Filters
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {(stateFilter.length > 0 || cancellationFilter !== 'all') && (
              <div className="mt-2">
                <span className="text-xs text-gray-500">Active Filters: </span>
                {cancellationFilter !== 'all' && (
                  <span className="text-xs text-indigo-600 font-medium mr-2">
                    Cancellation: {cancellationFilter.replace('_', ' ')}
                  </span>
                )}
                {stateFilter.length > 0 && (
                  <span className="text-xs text-indigo-600 font-medium">
                    States: {stateFilter.join(', ')}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="text-sm text-gray-600">
            Showing {filteredOrders.length} of {orders.length} orders
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <div className="w-full" style={{ minWidth: '900px' }}>
          <table className="w-full min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                    No orders found
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const firstItem = order.items && order.items[0];
                  const itemData = firstItem?.product || firstItem;
                  const orderName = itemData?.name || 'Order';
                  
                  return (
                    <tr key={order._id} className={`hover:bg-gray-50 ${
                      order.cancellationStatus === 'approved' ? 'bg-red-50 border-l-4 border-red-400' : 
                      order.cancellationStatus === 'requested' ? 'bg-orange-50 border-l-4 border-orange-400' : 
                      order.cancellationStatus === 'rejected' ? 'bg-yellow-50 border-l-4 border-yellow-400' : ''
                    }`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        <div className="flex items-center gap-2">
                          {orderName}
                          {order.cancellationStatus === 'requested' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                              ⏳ Cancel Request
                            </span>
                          )}
                          {order.cancellationStatus === 'approved' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              ❌ Cancelled
                            </span>
                          )}
                          {order.cancellationStatus === 'rejected' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                              ❌ Cancel Rejected
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.orderId || order._id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>{order.customerName}</div>
                        <div className="text-xs text-gray-400">{order.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {toIST(order.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{order.totalAmount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={order.orderStatus}
                          onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                          disabled={updatingOrder === order._id || order.cancellationStatus === 'approved'}
                          className={`text-sm rounded-full px-3 py-1 font-semibold ${statusColors[order.orderStatus] || 'bg-gray-100 text-gray-800'} ${(updatingOrder === order._id || order.cancellationStatus === 'approved') ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={order.cancellationStatus === 'approved' ? 'Cannot change status of cancelled orders' : ''}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="manufacturing">Manufacturing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            order.revenueStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            order.revenueStatus === 'earned' ? 'bg-green-100 text-green-800' :
                            order.revenueStatus === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.revenueStatus || 'pending'}
                          </span>
                          {order.revenueStatus === 'earned' && order.paymentMethod === 'cod' && (
                            <button
                              onClick={() => {
                                setSelectedOrderForRevenue(order);
                                setShowRevenueModal(true);
                              }}
                              disabled={updatingOrder === order._id}
                              className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                              {updatingOrder === order._id ? 'Confirming...' : 'Confirm Revenue'}
                            </button>
                          )}
                          {order.revenueAmount > 0 && (
                            <div className="text-xs text-gray-500">
                              ₹{order.revenueAmount}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${paymentStatusColors[order.paymentStatus] || 'bg-gray-100 text-gray-800'}`}>
                          {order.paymentStatus}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          {order.paymentMethod?.toUpperCase() || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal - Continue in next part due to length */}
      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailsModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onUpdateStatus={updateOrderStatus}
            onCancellationRequest={handleCancellationRequest}
            onProcessRefund={processRefund}
            onConfirmCOD={confirmCODReceipt}
            onOpenCancellationModal={openCancellationModal}
            updatingOrder={updatingOrder}
            processingRefund={processingRefund}
            confirmingCOD={confirmingCOD}
            toIST={toIST}
          />
        )}
      </AnimatePresence>

      {/* Cancellation Modal */}
      <AnimatePresence>
        {showCancellationModal && selectedOrder && (
          <CancellationModal
            order={selectedOrder}
            action={cancellationAction}
            rejectionReason={rejectionReason}
            onRejectionReasonChange={setRejectionReason}
            onConfirm={() => handleCancellationRequest(selectedOrder._id, cancellationAction)}
            onCancel={() => {
              setShowCancellationModal(false);
              setCancellationAction(null);
              setRejectionReason('');
            }}
            updating={updatingOrder === selectedOrder._id}
            paymentMethod={selectedOrder.paymentMethod}
          />
        )}
      </AnimatePresence>

      {/* Revenue Confirmation Modal */}
      <AnimatePresence>
        {showRevenueModal && selectedOrderForRevenue && (
          <RevenueModal
            order={selectedOrderForRevenue}
            onConfirm={handleConfirmRevenue}
            onCancel={() => {
              setShowRevenueModal(false);
              setSelectedOrderForRevenue(null);
            }}
            confirming={confirmingCOD}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Order Details Modal Component
const OrderDetailsModal = ({ order, onClose, onUpdateStatus, onCancellationRequest, onProcessRefund, onConfirmCOD, onOpenCancellationModal, updatingOrder, processingRefund, confirmingCOD, toIST }) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl mx-auto bg-white rounded-xl shadow-2xl p-6 border border-gray-200 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-800 bg-white rounded-full p-2 shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200 z-10"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="mb-4">
          <h2 className="text-xl font-bold mb-1 text-indigo-700 text-center">
            {order.items?.[0]?.product?.name || order.items?.[0]?.name || 'Order'}
          </h2>
          <div className="text-center text-xs text-gray-400">Order ID: {order.orderId || order._id}</div>
        </div>
        
        <div className="space-y-3">
          {/* Customer Info */}
          <div className="border-b pb-3">
            <h4 className="font-medium mb-2 text-sm text-gray-700">Customer Information</h4>
            <div className="text-sm space-y-1">
              <p><span className="font-medium">Name:</span> {order.customerName}</p>
              <p><span className="font-medium">Email:</span> {order.email}</p>
              <p><span className="font-medium">Phone:</span> {order.phone}</p>
            </div>
          </div>

          {/* Shipping Address */}
          {order.address && (
            <div className="border-b pb-3">
              <h4 className="font-medium mb-2 text-sm text-gray-700">Shipping Address</h4>
              <div className="text-sm">
                <p>{order.address.street}</p>
                <p>{order.address.city}, {order.address.state}</p>
                <p>{order.address.pincode}</p>
              </div>
            </div>
          )}

          {/* Order Items */}
          <div>
            <h4 className="font-medium mb-2 text-sm text-gray-700">Order Items</h4>
            <div className="space-y-2">
              {order.items?.map((item, index) => {
                const itemData = item.product || item;
                return (
                  <div key={index} className="border rounded p-3 bg-gray-50">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-sm">{itemData?.name || 'Item'}</span>
                      <span className="font-bold text-sm">₹{item.price || itemData?.price}</span>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <p>Quantity: {item.quantity || 1}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Information */}
          <div className="border-b pb-3">
            <h4 className="font-medium mb-2 text-sm text-gray-700">Payment Information</h4>
            <div className="text-sm space-y-1">
              <p><span className="font-medium">Method:</span> {order.paymentMethod?.toUpperCase() || 'N/A'}</p>
              <p><span className="font-medium">Status:</span> 
                <span className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${
                  order.paymentStatus === 'completed' 
                    ? 'bg-green-100 text-green-800'
                    : order.paymentStatus === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : order.paymentStatus === 'failed'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {order.paymentStatus?.toUpperCase() || 'PENDING'}
                </span>
              </p>
              {order.paymentMethod === 'cod' && (
                <p className="text-blue-700 text-xs mt-2">💳 Payment will be collected on delivery</p>
              )}
              {(order.paymentMethod === 'online' || order.paymentMethod === 'card' || order.paymentMethod === 'upi') && (
                <>
                  {order.paymentStatus === 'completed' && (
                    <p className="text-green-700 text-xs mt-2">✅ Payment completed online</p>
                  )}
                  {order.paymentStatus === 'pending' && (
                    <p className="text-yellow-700 text-xs mt-2">⏳ Payment is pending</p>
                  )}
                  {order.paymentStatus === 'failed' && (
                    <p className="text-red-700 text-xs mt-2">❌ Payment failed</p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Delivery Status Management Section */}
          {order.cancellationStatus !== 'approved' && (
            <div className="border-b pb-3">
              <h4 className="font-medium mb-3 text-sm text-gray-700">Delivery Status Management</h4>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-xs text-blue-800 mb-3">
                  <strong>Current Status:</strong> <span className="font-semibold text-blue-900">{order.orderStatus?.charAt(0).toUpperCase() + order.orderStatus?.slice(1) || 'Pending'}</span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onUpdateStatus(order._id, 'processing')}
                    disabled={updatingOrder === order._id || order.orderStatus === 'processing' || order.orderStatus === 'shipped' || order.orderStatus === 'out-for-delivery' || order.orderStatus === 'delivered' || order.orderStatus === 'cancelled'}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      order.orderStatus === 'processing' 
                        ? 'bg-blue-600 text-white cursor-not-allowed' 
                        : updatingOrder === order._id || order.orderStatus === 'shipped' || order.orderStatus === 'out-for-delivery' || order.orderStatus === 'delivered' || order.orderStatus === 'cancelled'
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {updatingOrder === order._id && order.orderStatus !== 'processing' ? 'Updating...' : '📦 Processing'}
                  </button>
                  <button
                    onClick={() => onUpdateStatus(order._id, 'shipped')}
                    disabled={updatingOrder === order._id || order.orderStatus === 'shipped' || order.orderStatus === 'out-for-delivery' || order.orderStatus === 'delivered' || order.orderStatus === 'cancelled' || (order.orderStatus !== 'processing' && order.orderStatus !== 'confirmed')}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      order.orderStatus === 'shipped' 
                        ? 'bg-indigo-600 text-white cursor-not-allowed' 
                        : updatingOrder === order._id || order.orderStatus === 'out-for-delivery' || order.orderStatus === 'delivered' || order.orderStatus === 'cancelled' || (order.orderStatus !== 'processing' && order.orderStatus !== 'confirmed')
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {updatingOrder === order._id && order.orderStatus !== 'shipped' ? 'Updating...' : '🚚 Shipped'}
                  </button>
                  <button
                    onClick={() => onUpdateStatus(order._id, 'out-for-delivery')}
                    disabled={updatingOrder === order._id || order.orderStatus === 'out-for-delivery' || order.orderStatus === 'delivered' || order.orderStatus === 'cancelled' || order.orderStatus !== 'shipped'}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      order.orderStatus === 'out-for-delivery' 
                        ? 'bg-orange-600 text-white cursor-not-allowed' 
                        : updatingOrder === order._id || order.orderStatus === 'delivered' || order.orderStatus === 'cancelled' || order.orderStatus !== 'shipped'
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-orange-600 text-white hover:bg-orange-700'
                    }`}
                  >
                    {updatingOrder === order._id && order.orderStatus !== 'out-for-delivery' ? 'Updating...' : '🚛 Out for Delivery'}
                  </button>
                  <button
                    onClick={() => onUpdateStatus(order._id, 'delivered')}
                    disabled={updatingOrder === order._id || order.orderStatus === 'delivered' || order.orderStatus === 'cancelled' || order.orderStatus !== 'out-for-delivery'}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      order.orderStatus === 'delivered' 
                        ? 'bg-green-600 text-white cursor-not-allowed' 
                        : updatingOrder === order._id || order.orderStatus === 'cancelled' || order.orderStatus !== 'out-for-delivery'
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {updatingOrder === order._id && order.orderStatus !== 'delivered' ? 'Updating...' : '✅ Delivered'}
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-3">
                  <strong>Note:</strong> Status updates will be reflected in customer's order tracking. Updates are saved to database.
                </p>
              </div>
            </div>
          )}

          {/* Cancellation Information */}
          {order.cancellationRequested && (
            <div className="border-b pb-3">
              <h4 className="font-medium mb-2 text-sm text-red-600">Cancellation Details</h4>
              <div className={`p-3 border rounded ${
                order.cancellationStatus === 'requested' ? 'bg-orange-50 border-orange-200' :
                order.cancellationStatus === 'approved' ? 'bg-red-50 border-red-200' :
                order.cancellationStatus === 'rejected' ? 'bg-yellow-50 border-yellow-200' :
                'bg-gray-50 border-gray-200'
              }`}>
                <p className="text-sm"><strong>Status:</strong> 
                  <span className={`ml-1 ${
                    order.cancellationStatus === 'requested' ? 'text-orange-700' :
                    order.cancellationStatus === 'approved' ? 'text-red-700' :
                    order.cancellationStatus === 'rejected' ? 'text-yellow-700' :
                    'text-gray-700'
                  }`}>
                    {order.cancellationStatus === 'requested' ? 'Cancellation Requested' :
                     order.cancellationStatus === 'approved' ? 'Cancelled' :
                     order.cancellationStatus === 'rejected' ? 'Cancellation Rejected' :
                     'Unknown'}
                  </span>
                </p>
                {order.cancellationReason && (
                  <p className="text-sm"><strong>Customer Reason:</strong> {order.cancellationReason}</p>
                )}

                {/* Refund Information for Online Payments */}
                {order.cancellationStatus === 'approved' && 
                 order.paymentMethod === 'online' && 
                 order.paymentStatus === 'completed' && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm font-semibold text-blue-900 mb-2">💰 Refund Information</p>
                    <div className="text-sm space-y-1">
                      <p><strong>Refund Amount:</strong> ₹{order.refundAmount || order.totalAmount}</p>
                      <p><strong>Refund Status:</strong> 
                        <span className={`ml-1 font-semibold ${
                          order.refundStatus === 'completed' ? 'text-green-600' :
                          order.refundStatus === 'processing' ? 'text-blue-600' :
                          order.refundStatus === 'pending' ? 'text-yellow-600' :
                          order.refundStatus === 'failed' ? 'text-red-600' :
                          'text-gray-600'
                        }`}>
                          {order.refundStatus === 'completed' ? '✅ Completed' :
                           order.refundStatus === 'processing' ? '⏳ Processing' :
                           order.refundStatus === 'pending' ? '⏰ Pending' :
                           order.refundStatus === 'failed' ? '❌ Failed' :
                           '⏰ Pending'}
                        </span>
                      </p>
                      {order.refundStatus === 'pending' && (
                        <button
                          onClick={() => onProcessRefund(order._id)}
                          disabled={processingRefund}
                          className="w-full mt-3 px-4 py-3 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                          {processingRefund ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                              Processing Refund...
                            </>
                          ) : (
                            <>💳 Process Refund Now</>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Admin Actions for Cancellation Requests */}
              {order.cancellationStatus === 'requested' && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                  <h5 className="font-medium text-blue-800 mb-2">Admin Actions</h5>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onOpenCancellationModal('approve')}
                      disabled={updatingOrder === order._id}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      ✅ Approve Cancellation
                    </button>
                    <button
                      onClick={() => onOpenCancellationModal('reject')}
                      disabled={updatingOrder === order._id}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      ❌ Reject Cancellation
                    </button>
                  </div>
                </div>
              )}

              {/* COD Confirmation for Delivered Orders */}
              {order.paymentMethod === 'cod' && 
               order.orderStatus === 'delivered' && 
               order.revenueStatus === 'earned' && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-sm font-semibold text-green-900 mb-2">💰 COD Payment Confirmation</p>
                  <p className="text-sm text-green-800 mb-3">
                    This COD order has been delivered. Please confirm payment receipt to add to revenue.
                  </p>
                  <button
                    onClick={() => onConfirmCOD(order._id)}
                    disabled={confirmingCOD}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {confirmingCOD ? 'Confirming...' : 'Confirm COD Payment'}
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end pt-3 border-t">
            <p className="font-bold text-lg text-indigo-600">Total Amount: ₹{order.totalAmount}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Cancellation Modal Component
const CancellationModal = ({ order, action, rejectionReason, onRejectionReasonChange, onConfirm, onCancel, updating, paymentMethod }) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full border border-gray-200"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-full ${
            action === 'approve' ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {action === 'approve' ? (
              <span className="text-green-600 text-xl">✅</span>
            ) : (
              <span className="text-red-600 text-xl">❌</span>
            )}
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            {action === 'approve' ? 'Approve Cancellation' : 'Reject Cancellation'}
          </h3>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Order ID:</p>
          <p className="text-xs font-mono text-gray-900">{order.orderId || order._id}</p>
          <p className="text-sm text-gray-600 mt-2">Customer: {order.customerName}</p>
          {order.cancellationReason && (
            <p className="text-sm text-gray-600">Reason: {order.cancellationReason}</p>
          )}
        </div>

        {action === 'reject' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => onRejectionReasonChange(e.target.value)}
              placeholder="Please provide a reason for rejecting the cancellation request..."
              rows="3"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            />
          </div>
        )}

        <div className={`border rounded-lg p-3 mb-6 ${
          action === 'approve' 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <p className={`text-sm ${
            action === 'approve' ? 'text-green-800' : 'text-red-800'
          }`}>
            <strong>
              {action === 'approve' 
                ? 'This will cancel the order and restore product stock.' 
                : 'This will reject the cancellation request and continue processing the order.'}
              {action === 'approve' && paymentMethod === 'online' && (
                <span className="block mt-2">⚠️ Refund will need to be processed separately for online payments.</span>
              )}
            </strong>
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={updating}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={updating || (action === 'reject' && !rejectionReason.trim())}
            className={`flex-1 px-4 py-3 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              action === 'approve' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {updating ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Processing...
              </span>
            ) : (
              `${action === 'approve' ? 'Approve' : 'Reject'} Cancellation`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Revenue Confirmation Modal Component
const RevenueModal = ({ order, onConfirm, onCancel, confirming }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Confirm COD Revenue</h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Order Details</h4>
              <p className="text-sm text-gray-600">Order ID: #{order.orderId?.slice(-6)?.toUpperCase() || order._id?.slice(-6)?.toUpperCase()}</p>
              <p className="text-sm text-gray-600">Customer: {order.customerName}</p>
              <p className="text-sm text-gray-600">Total Amount: ₹{order.totalAmount}</p>
              <p className="text-sm text-gray-600">Revenue Amount: ₹{order.revenueAmount || order.totalAmount}</p>
            </div>

            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <p className="text-sm text-green-800">
                  This will confirm that you have received the COD payment and add the amount to your revenue.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onCancel}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onConfirm}
                disabled={confirming}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {confirming ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Confirming...
                  </span>
                ) : (
                  'Confirm Revenue'
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Orders;
