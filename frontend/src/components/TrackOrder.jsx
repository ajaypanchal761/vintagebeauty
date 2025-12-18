import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import orderService from '../services/orderService';
import BottomNavbar from './BottomNavbar';
import Footer from './Footer';
import logo from '../assets/logo vintage.png';
import heroimg from '../assets/heroimg.png';
import toast from 'react-hot-toast';

const TrackOrder = () => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchValue.trim()) {
      toast.error('Please enter an order number or tracking number');
      return;
    }

    setLoading(true);
    setError(null);
    setOrder(null);

    try {
      const response = await orderService.trackOrder(searchValue.trim());
      if (response.success && response.data) {
        setOrder(response.data);
      } else {
        setError('Order not found. Please check your order number or tracking number.');
      }
    } catch (error) {
      console.error('Error tracking order:', error);
      setError(error.message || 'Failed to track order. Please try again.');
      toast.error(error.message || 'Order not found');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'confirmed': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'processing': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'shipped': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
      'out-for-delivery': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'delivered': 'bg-green-500/20 text-green-400 border-green-500/30',
      'cancelled': 'bg-red-500/20 text-red-400 border-red-500/30'
    };
    return colors[status] || colors['pending'];
  };

  const getStatusIcon = (status) => {
    const icons = {
      'pending': '⏳',
      'confirmed': '✓',
      'processing': '⚙️',
      'shipped': '📦',
      'out-for-delivery': '🚚',
      'delivered': '✅',
      'cancelled': '❌'
    };
    return icons[status] || '⏳';
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-500/20 text-yellow-400',
      'completed': 'bg-green-500/20 text-green-400',
      'failed': 'bg-red-500/20 text-red-400',
      'refunded': 'bg-blue-500/20 text-blue-400'
    };
    return colors[status] || colors['pending'];
  };

  return (
    <div className="min-h-screen bg-black text-white pb-20 md:pb-0">
      {/* Header */}
      <nav className="w-full bg-black border-b border-gray-800 sticky top-0 z-40">
        <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-900 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex items-center gap-2 md:gap-3">
              {logo && (
                <img
                  src={logo}
                  alt="Vintage Beauty Logo"
                  className="h-6 md:h-8 w-auto"
                />
              )}
              <h1 className="text-base md:text-xl lg:text-2xl font-semibold uppercase tracking-wider text-white">
                Track Order
              </h1>
            </div>

            <div className="w-10"></div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 max-w-4xl">
        {/* Search Section */}
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-6 md:p-8 mb-6 border border-gray-800">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-4">Enter Order Details</h2>
          <p className="text-gray-400 text-sm md:text-base mb-6">
            Enter your order number or tracking number to track your order status
          </p>
          
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Enter Order Number or Tracking Number"
                className="w-full pl-12 pr-4 py-3 md:py-4 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] transition-colors text-sm md:text-base"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !searchValue.trim()}
              className="w-full bg-[#D4AF37] hover:bg-[#F4D03F] disabled:bg-gray-700 disabled:cursor-not-allowed text-black font-bold px-6 py-3 md:py-4 rounded-lg text-sm md:text-base transition-all duration-300 shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <span>Track Order</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Error Message */}
        {error && !loading && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 md:p-6 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-red-400 mb-1">Order Not Found</h3>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Order Details */}
        {order && !loading && (
          <div className="space-y-6">
            {/* Order Summary Card */}
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-6 md:p-8 border border-gray-800">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Order Details</h2>
                  <p className="text-gray-400 text-sm">Order Number: <span className="text-[#D4AF37] font-semibold">{order.orderNumber || 'N/A'}</span></p>
                  {order.trackingNumber && (
                    <p className="text-gray-400 text-sm mt-1">Tracking Number: <span className="text-[#D4AF37] font-semibold">{order.trackingNumber}</span></p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`px-3 py-1.5 rounded-full text-xs md:text-sm font-semibold border ${getStatusColor(order.orderStatus)}`}>
                    {getStatusIcon(order.orderStatus)} {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1).replace('-', ' ')}
                  </span>
                  <span className={`px-3 py-1.5 rounded-full text-xs md:text-sm font-semibold ${getPaymentStatusColor(order.paymentStatus)}`}>
                    Payment: {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-800">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Order Date</p>
                  <p className="text-white font-semibold">{formatDate(order.createdAt)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Total Amount</p>
                  <p className="text-white font-semibold text-lg">₹{order.totalPrice?.toLocaleString() || '0'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Payment Method</p>
                  <p className="text-white font-semibold">{order.paymentMethod?.toUpperCase() || 'N/A'}</p>
                </div>
                {order.shippingAddress && (
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Delivery Address</p>
                    <p className="text-white font-semibold text-sm">
                      {order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Tracking History */}
            {order.trackingHistory && order.trackingHistory.length > 0 && (
              <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-6 md:p-8 border border-gray-800">
                <h3 className="text-xl md:text-2xl font-bold text-white mb-6">Tracking History</h3>
                <div className="space-y-4">
                  {order.trackingHistory.map((track, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${track.completed ? 'bg-[#D4AF37]' : 'bg-gray-700 border-2 border-gray-600'}`}></div>
                        {index < order.trackingHistory.length - 1 && (
                          <div className={`w-0.5 h-full ${track.completed ? 'bg-[#D4AF37]' : 'bg-gray-700'}`} style={{ minHeight: '40px' }}></div>
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                          <div>
                            <h4 className={`text-base md:text-lg font-semibold ${track.completed ? 'text-white' : 'text-gray-400'}`}>
                              {track.status}
                            </h4>
                            <p className="text-gray-400 text-sm mt-1">{track.description}</p>
                          </div>
                          {track.date && (
                            <p className="text-gray-500 text-xs md:text-sm">{formatDate(track.date)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Order Items */}
            {order.orderItems && order.orderItems.length > 0 && (
              <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-6 md:p-8 border border-gray-800">
                <h3 className="text-xl md:text-2xl font-bold text-white mb-6">Order Items</h3>
                <div className="space-y-4">
                  {order.orderItems.map((item, index) => (
                    <div key={index} className="flex gap-4 pb-4 border-b border-gray-800 last:border-0 last:pb-0">
                      <img
                        src={item.image || item.product?.images?.[0] || heroimg}
                        alt={item.name}
                        className="w-16 h-16 md:w-20 md:h-20 rounded-lg object-cover"
                        onError={(e) => { e.target.src = heroimg; }}
                      />
                      <div className="flex-1">
                        <h4 className="text-white font-semibold text-sm md:text-base mb-1">{item.name}</h4>
                        {item.size && (
                          <p className="text-gray-400 text-xs md:text-sm mb-1">Size: {item.size}</p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-gray-400 text-xs md:text-sm">Quantity: {item.quantity}</p>
                          <p className="text-[#D4AF37] font-semibold">₹{((item.price || item.selectedPrice || 0) * item.quantity).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate('/orders')}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300 border border-gray-700"
              >
                View All Orders
              </button>
              <button
                onClick={() => {
                  setOrder(null);
                  setSearchValue('');
                  setError(null);
                }}
                className="flex-1 bg-[#D4AF37] hover:bg-[#F4D03F] text-black font-semibold px-6 py-3 rounded-lg transition-all duration-300"
              >
                Track Another Order
              </button>
            </div>
          </div>
        )}

        {/* Help Section */}
        {!order && !loading && !error && (
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-6 md:p-8 border border-gray-800 mt-6">
            <h3 className="text-lg md:text-xl font-bold text-white mb-4">Need Help?</h3>
            <div className="space-y-3 text-gray-400 text-sm md:text-base">
              <p>• Your order number can be found in your order confirmation email</p>
              <p>• Tracking number is provided once your order is shipped</p>
              <p>• If you're logged in, you can view all your orders in the "My Orders" section</p>
              <p>• For any queries, contact our support team</p>
            </div>
          </div>
        )}
      </div>

      <Footer />
      <BottomNavbar />
    </div>
  );
};

export default TrackOrder;

