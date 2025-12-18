import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import userService from '../services/userService';
import couponService from '../services/couponService';
import toast from 'react-hot-toast';
import BottomNavbar from './BottomNavbar';
import logo from '../assets/logo vintage.png';
import heroimg from '../assets/heroimg.png';

const OrderSummary = () => {
  const navigate = useNavigate();
  const { items, getTotalPrice, getItemCount, clearCart } = useCartStore();
  const { user } = useAuthStore();
  
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [appliedCouponData, setAppliedCouponData] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loadingAddress, setLoadingAddress] = useState(true);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(true);
  const [paymentGateway, setPaymentGateway] = useState('razorpay'); // 'razorpay' or 'cashfree'
  
  const totalPrice = getTotalPrice() || 0;
  const itemCount = getItemCount() || 0;
  const shipping = totalPrice > 500 ? 0 : 50;
  
  // Calculate discount
  let discount = 0;
  if (appliedCouponData) {
    if (appliedCouponData.discountType === 'percentage') {
      discount = Math.round((totalPrice * appliedCouponData.discountValue) / 100);
      // Apply max discount if set
      if (appliedCouponData.maxDiscount && discount > appliedCouponData.maxDiscount) {
        discount = appliedCouponData.maxDiscount;
      }
    } else if (appliedCouponData.discountType === 'fixed') {
      discount = appliedCouponData.discountValue || 0;
    }
  }
  
  const finalTotal = Math.max(0, (Number(totalPrice) || 0) + (Number(shipping) || 0) - (Number(discount) || 0));

  // Fetch active coupons on component mount
  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        setLoadingCoupons(true);
        const response = await couponService.getActiveCoupons();
        if (response.success) {
          setAvailableCoupons(response.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch coupons:', error);
        // Don't show error toast, just log it - coupons are optional
      } finally {
        setLoadingCoupons(false);
      }
    };

    fetchCoupons();
  }, []);

  // Fetch user addresses on component mount
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        setLoadingAddress(true);
        const token = localStorage.getItem('token');
        if (!token || !user) {
          navigate('/login');
          return;
        }

        const addressesList = await userService.getAddresses();
        setAddresses(addressesList || []);

        // Set default address or first address
        if (addressesList && addressesList.length > 0) {
          const defaultAddress = addressesList.find(addr => addr.isDefault) || addressesList[0];
          if (defaultAddress) {
            setDeliveryAddress({
              name: defaultAddress.name,
              phone: defaultAddress.phone,
              address: defaultAddress.address,
              city: defaultAddress.city,
              state: defaultAddress.state,
              pincode: defaultAddress.pincode
            });
          }
        } else {
          // No addresses found, show message
          toast.error('Please add a delivery address first');
          setTimeout(() => {
            navigate('/addresses');
          }, 2000);
        }
      } catch (error) {
        console.error('Failed to fetch addresses:', error);
        toast.error(error.message || 'Failed to load addresses');
        if (error.response?.status === 401) {
          navigate('/login');
        }
      } finally {
        setLoadingAddress(false);
      }
    };

    fetchAddresses();
  }, [user, navigate]);

  // Helper function to get safe image - uses product image from cart item or heroimg as fallback
  const getSafeImage = (itemImage) => {
    if (typeof itemImage === 'string') {
      if (itemImage.includes('images vintage') || itemImage.includes('images%20vintage')) {
        return heroimg;
      }
      if (itemImage.startsWith('http') || itemImage.startsWith('/') || itemImage.startsWith('../')) {
        return itemImage;
      }
    }
    if (itemImage && typeof itemImage === 'object') {
      return itemImage;
    }
    // Use product image from cart item if available
    if (itemImage) {
      return itemImage;
    }
    return heroimg;
  };

  const handleApplyCoupon = async () => {
    setCouponError('');
    const code = couponCode.toUpperCase().trim();
    
    if (!code) {
      setCouponError('Please enter a coupon code');
      return;
    }
    
    try {
      // Verify coupon from backend
      const response = await couponService.getCouponByCode(code);
      if (response.success && response.data) {
        const coupon = response.data;
        
        // Check minimum purchase amount
        if (totalPrice < coupon.minPurchase) {
          setCouponError(`Minimum order of ₹${coupon.minPurchase} required for this coupon`);
          return;
        }
        
        // Check if coupon is valid
        const now = new Date();
        if (!coupon.isActive) {
          setCouponError('This coupon is not active');
          return;
        }
        
        if (now < new Date(coupon.validFrom) || now > new Date(coupon.validUntil)) {
          setCouponError('This coupon is not valid at this time');
          return;
        }
        
        if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
          setCouponError('Coupon usage limit reached');
          return;
        }
        
        // Apply coupon
        setAppliedCoupon(coupon.code);
        setAppliedCouponData(coupon);
        setCouponError('');
        toast.success('Coupon applied successfully!');
      }
    } catch (error) {
      console.error('Apply coupon error:', error);
      setCouponError(error.message || 'Invalid coupon code');
    }
  };
  
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setAppliedCouponData(null);
    setCouponCode('');
    setCouponError('');
  };
  
  const handlePayment = () => {
    if (!deliveryAddress) {
      toast.error('Please add a delivery address first');
      navigate('/addresses');
      return;
    }

    navigate('/payment', { 
      state: { 
        orderItems: items.map(item => ({
          ...item,
          image: getSafeImage(item.image || item.product?.image || item.product?.images?.[0])
        })),
        totalPrice,
        shipping,
        discount,
        finalTotal,
        itemCount,
        couponCode: appliedCoupon,
        deliveryAddress,
        paymentGateway // Pass selected payment gateway
      } 
    });
  };
  
  // Calculate estimated delivery date (3-5 days from today)
  const getEstimatedDelivery = () => {
    const today = new Date();
    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() + Math.floor(Math.random() * 3) + 3);
    return deliveryDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white pb-20 md:pb-0">
        <nav className="w-full bg-black border-b border-gray-800 sticky top-0 z-40">
          <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate('/cart')}
                className="p-2 hover:bg-gray-900 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-base md:text-xl lg:text-2xl font-semibold uppercase tracking-wider text-white">
                Order Summary
              </h1>
              <div className="w-10"></div>
            </div>
          </div>
        </nav>

        <div className="container mx-auto px-4 md:px-6 py-12 md:py-20 max-w-2xl">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">No items in cart</h2>
            <button
              onClick={() => navigate('/products')}
              className="bg-[#D4AF37] hover:bg-[#F4D03F] text-black font-bold px-6 md:px-8 py-3 md:py-4 rounded-lg transition-all duration-300 shadow-lg"
            >
              Continue Shopping
            </button>
          </div>
        </div>

        <BottomNavbar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-20 md:pb-0">
      {/* Header */}
      <nav className="w-full bg-black border-b border-gray-800 sticky top-0 z-40">
        <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/cart')}
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
                Order Summary
              </h1>
            </div>

            <div className="w-10"></div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 md:px-6 py-4 md:py-8 max-w-5xl">
        {/* Order Items Section */}
        <div className="mb-6 md:mb-8">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">
            Order Items ({itemCount} {itemCount === 1 ? 'item' : 'items'})
          </h2>

          <div className="space-y-3 md:space-y-4">
            {items.map((item, index) => {
              // Get item ID
              const itemId = item.id || item._id || item.product?._id || item.product?.id || item.product || `item-${index}`;
              // Ensure price is a number
              const itemPrice = Number(item.selectedPrice) || Number(item.price) || Number(item.product?.price) || 0;
              // Ensure quantity is a number
              const quantity = Number(item.quantity) || 1;
              const itemTotal = isNaN(itemPrice) || isNaN(quantity) ? 0 : itemPrice * quantity;
              const productImage = item.image || item.product?.image || item.product?.images?.[0] || heroimg;
              
              // Check if product is out of stock
              // Only show "Out of Stock" when stock is exactly 0
              const productStock = typeof item.product === 'object' ? Number(item.product?.stock) : null;
              const isOutOfStock = productStock !== null && productStock === 0;
              
              return (
                <div
                  key={`${itemId}-${item.size || 'default'}-${index}`}
                  className="bg-gradient-to-br from-gray-900 to-black rounded-xl md:rounded-2xl p-4 md:p-6 border border-gray-800 hover:border-[#D4AF37]/30 transition-all duration-300 shadow-lg"
                >
                  <div className="flex gap-4 md:gap-6">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      <div className="w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden bg-gray-800 border border-gray-700">
                        <img
                          src={getSafeImage(item.image, productImage)}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base md:text-lg font-bold text-white mb-1">
                            {item.name}
                          </h3>
                          {item.size && (
                            <p className="text-sm md:text-base text-gray-400 mb-2">
                              Size: <span className="text-[#D4AF37]">{item.size}</span>
                            </p>
                          )}
                          <p className="text-sm md:text-base text-gray-400 mb-2">
                            Quantity: <span className="text-white font-semibold">{item.quantity || 1}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-gray-400">Unit Price</p>
                        {isOutOfStock ? (
                          <p className="text-base md:text-lg font-bold text-red-400">
                            Out of Stock
                          </p>
                        ) : (
                          <p className="text-base md:text-lg font-bold text-[#D4AF37]">
                            ₹{itemPrice > 0 ? itemPrice.toLocaleString() : '0'}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-800">
                        <p className="text-base md:text-lg font-bold text-white">Item Total</p>
                        {isOutOfStock ? (
                          <p className="text-xl md:text-2xl font-bold text-red-400">
                            Out of Stock
                          </p>
                        ) : (
                          <p className="text-xl md:text-2xl font-bold text-[#D4AF37]">
                            ₹{itemTotal > 0 ? itemTotal.toLocaleString() : '0'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Delivery Address Section */}
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl md:rounded-2xl p-5 md:p-6 border border-gray-800 shadow-xl mb-6 md:mb-8">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Delivery Address
            </h3>
            <button 
              onClick={() => navigate('/addresses')}
              className="text-[#D4AF37] hover:text-amber-500 text-sm font-medium transition-colors"
            >
              Change
            </button>
          </div>
          
          {loadingAddress ? (
            <div className="space-y-2 text-sm md:text-base">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                <div className="h-4 bg-gray-700 rounded w-full"></div>
                <div className="h-4 bg-gray-700 rounded w-2/3"></div>
              </div>
            </div>
          ) : deliveryAddress ? (
            <div className="space-y-2 text-sm md:text-base">
              <p className="text-white font-semibold">{deliveryAddress.name}</p>
              <p className="text-gray-400">{deliveryAddress.phone}</p>
              <p className="text-gray-300">{deliveryAddress.address}</p>
              <p className="text-gray-300">{deliveryAddress.city}, {deliveryAddress.state} - {deliveryAddress.pincode}</p>
            </div>
          ) : (
            <div className="space-y-2 text-sm md:text-base">
              <p className="text-red-400">No delivery address found. Please add an address.</p>
              <button
                onClick={() => navigate('/addresses')}
                className="mt-2 bg-[#D4AF37] hover:bg-[#F4D03F] text-black font-bold px-4 py-2 rounded-lg transition-all duration-300"
              >
                Add Address
              </button>
            </div>
          )}
          
          <div className="mt-4 pt-4 border-t border-gray-800">
            <p className="text-xs md:text-sm text-gray-400">
              <span className="text-[#D4AF37]">📦 Estimated Delivery:</span> {getEstimatedDelivery()}
            </p>
          </div>
        </div>

        {/* Coupon Code Section */}
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl md:rounded-2xl p-5 md:p-6 border border-gray-800 shadow-xl mb-6 md:mb-8">
          <h3 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6 pb-3 md:pb-4 border-b border-gray-800 flex items-center gap-2">
            <svg className="w-5 h-5 md:w-6 md:h-6 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Apply Coupon
          </h3>
          
          {appliedCoupon ? (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 md:p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-green-400 font-semibold">Coupon Applied: {appliedCoupon}</p>
                    <p className="text-xs text-gray-400">
                      {appliedCouponData?.discountType === 'percentage' 
                        ? `${appliedCouponData.discountValue}% OFF`
                        : `₹${appliedCouponData?.discountValue || 0} OFF`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRemoveCoupon}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 mb-4 w-full min-w-0">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Enter coupon code"
                className="flex-1 min-w-0 bg-gray-800 border border-gray-700 rounded-lg px-3 md:px-4 py-2 md:py-2.5 md:py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] transition-colors text-sm md:text-base"
                onKeyPress={(e) => e.key === 'Enter' && handleApplyCoupon()}
              />
              <button
                onClick={handleApplyCoupon}
                className="bg-[#D4AF37] hover:bg-amber-500 text-black font-bold px-3 md:px-6 py-2 md:py-2.5 md:py-3 rounded-lg transition-all duration-300 text-sm md:text-base whitespace-nowrap flex-shrink-0"
              >
                Apply
              </button>
            </div>
          )}
          
          {couponError && (
            <p className="text-red-400 text-sm mt-2">{couponError}</p>
          )}
          
          {availableCoupons.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-800">
              <p className="text-xs md:text-sm text-gray-400 mb-2">Available Coupons:</p>
              <div className="flex flex-wrap gap-2">
                {availableCoupons.map((coupon) => (
                  <span
                    key={coupon._id || coupon.code}
                    className="text-xs px-2 py-1 bg-gray-800 border border-gray-700 rounded text-gray-300 cursor-pointer hover:border-[#D4AF37] transition-colors"
                    onClick={() => {
                      setCouponCode(coupon.code);
                      handleApplyCoupon();
                    }}
                    title={`${coupon.discountValue}% OFF - Min. ₹${coupon.minPurchase}`}
                  >
                    {coupon.code}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Order Summary Card */}
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl md:rounded-2xl p-5 md:p-6 border border-gray-800 shadow-xl">
          <h3 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6 pb-3 md:pb-4 border-b border-gray-800">
            Price Details
          </h3>

          <div className="space-y-3 md:space-y-4 mb-4 md:mb-6">
            <div className="flex justify-between text-sm md:text-base">
              <span className="text-gray-400">Subtotal ({itemCount} items)</span>
              <span className="text-white font-semibold">₹{isNaN(totalPrice) ? '0' : totalPrice.toLocaleString()}</span>
            </div>
            
            {appliedCoupon && (
              <div className="flex justify-between text-sm md:text-base">
                <span className="text-gray-400">Discount ({appliedCoupon})</span>
                <span className="text-green-400 font-semibold">-₹{isNaN(discount) ? '0' : discount.toLocaleString()}</span>
              </div>
            )}
            
            <div className="flex justify-between text-sm md:text-base">
              <span className="text-gray-400">Shipping</span>
              <span className="text-white font-semibold">
                {shipping === 0 ? (
                  <span className="text-green-400">Free</span>
                ) : (
                  `₹${shipping}`
                )}
              </span>
            </div>

            {!isNaN(totalPrice) && totalPrice < 500 && !appliedCoupon && (
              <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-lg p-2 md:p-3">
                <p className="text-xs md:text-sm text-[#D4AF37]">
                  💡 Add ₹{(500 - totalPrice).toLocaleString()} more for free shipping!
                </p>
              </div>
            )}

            <div className="pt-3 md:pt-4 border-t border-gray-800">
              <div className="flex justify-between items-center">
                <span className="text-lg md:text-xl font-bold text-white">Total Amount</span>
                <span className="text-2xl md:text-3xl font-bold text-[#D4AF37]">
                  ₹{isNaN(finalTotal) ? '0' : finalTotal.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Gateway Selection */}
          <div className="mb-4 md:mb-6 pt-4 border-t border-gray-800">
            <h4 className="text-base md:text-lg font-bold text-white mb-3 md:mb-4">
              Select Payment Gateway
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {/* Razorpay Option */}
              <button
                onClick={() => setPaymentGateway('razorpay')}
                className={`p-3 md:p-4 rounded-lg border-2 transition-all duration-300 ${
                  paymentGateway === 'razorpay'
                    ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentGateway === 'razorpay' ? 'border-[#D4AF37]' : 'border-gray-600'
                  }`}>
                    {paymentGateway === 'razorpay' && (
                      <div className="w-3 h-3 rounded-full bg-[#D4AF37]"></div>
                    )}
                  </div>
                  <span className="text-white font-semibold text-sm md:text-base">Razorpay</span>
                </div>
              </button>

              {/* Cashfree Option */}
              <button
                onClick={() => setPaymentGateway('cashfree')}
                className={`p-3 md:p-4 rounded-lg border-2 transition-all duration-300 ${
                  paymentGateway === 'cashfree'
                    ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    paymentGateway === 'cashfree' ? 'border-[#D4AF37]' : 'border-gray-600'
                  }`}>
                    {paymentGateway === 'cashfree' && (
                      <div className="w-3 h-3 rounded-full bg-[#D4AF37]"></div>
                    )}
                  </div>
                  <span className="text-white font-semibold text-sm md:text-base">Cashfree</span>
                </div>
              </button>
            </div>
          </div>

          {/* Payment Button */}
          <button
            onClick={handlePayment}
            className="w-full bg-gradient-to-r from-[#D4AF37] to-amber-500 hover:from-[#F4D03F] hover:to-amber-400 text-black font-bold px-6 md:px-8 py-3 md:py-4 rounded-lg text-base md:text-lg transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-[1.02] flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <span>Proceed to Payment</span>
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <BottomNavbar />
    </div>
  );
};

export default OrderSummary;

