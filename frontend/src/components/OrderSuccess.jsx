import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useOrderStore } from '../store/orderStore';
import paymentService from '../services/paymentService';
import orderService from '../services/orderService';
import { useCartStore } from '../store/cartStore';
import toast from 'react-hot-toast';
import BottomNavbar from './BottomNavbar';
import logo from '../assets/logo vintage.png';
import heroimg from '../assets/heroimg.png';

const OrderSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addOrder } = useOrderStore();
  const { clearCart } = useCartStore();
  const [isProcessingCashfree, setIsProcessingCashfree] = useState(false);
  const cashfreeProcessedRef = useRef(false); // Track if Cashfree callback already processed
  
  // Get order data from location.state or sessionStorage (for Cashfree reload case)
  const getOrderData = () => {
    if (location.state && Object.keys(location.state).length > 0) {
      return location.state;
    }
    
    // Check sessionStorage for Cashfree order data
    const storedData = sessionStorage.getItem('order_success_data');
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        // Clear it after reading so it doesn't persist
        sessionStorage.removeItem('order_success_data');
        return parsed;
      } catch (e) {
        console.error('Failed to parse stored order data:', e);
      }
    }
    
    return {
      orderId: 'ORD-000000',
      orderItems: [],
      totalPrice: 0,
      shipping: 0,
      discount: 0,
      finalTotal: 0,
      paymentMethod: 'card',
      couponCode: null,
      deliveryAddress: null
    };
  };

  const orderData = getOrderData();

  // Use order data from backend response if available, otherwise use location.state
  const backendOrder = orderData.order || null;
  const orderId = backendOrder?._id || backendOrder?.orderNumber || orderData.orderId || 'ORD-000000';
  const orderItems = orderData.orderItems || [];
  const totalPrice = orderData.totalPrice || 0;
  const shipping = orderData.shipping || 0;
  const discount = orderData.discount || 0;
  const finalTotal = orderData.finalTotal || 0;
  // Use paymentMethod from backend order if available, otherwise from location.state
  const paymentMethod = backendOrder?.paymentMethod || orderData.paymentMethod || 'cod';
  const couponCode = orderData.couponCode || null;
  const deliveryAddress = orderData.deliveryAddress || null;

  // Helper function to get safe image - uses product image from order item or heroimg as fallback
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
    // Use product image from order item if available
    if (itemImage) {
      return itemImage;
    }
    return heroimg;
  };

  // Handle Cashfree payment callback
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const gateway = urlParams.get('gateway');
    const cashfreeOrderId = urlParams.get('order_id');
    const cashfreePaymentId = urlParams.get('payment_id');

    // If this is a Cashfree redirect callback
    if (gateway === 'cashfree' && cashfreeOrderId)  {
      // Prevent duplicate processing
      if (cashfreeProcessedRef.current) {
        console.log('Cashfree callback already processed, skipping...');
        return;
      }
      cashfreeProcessedRef.current = true;
      handleCashfreeCallback(cashfreeOrderId, cashfreePaymentId || null);
    }
  }, [location.search]);

  // Handle Cashfree payment callback
  const handleCashfreeCallback = async (cashfreeOrderId, cashfreePaymentId) => {
    if (isProcessingCashfree) return;
    
    setIsProcessingCashfree(true);
    
    // Check if paymentId is a placeholder (from URL template) - define outside try block
    const actualPaymentId = cashfreePaymentId && cashfreePaymentId !== '{payment_id}' 
      ? cashfreePaymentId 
      : null;
    
    try {
      // Get stored order data
      const storedData = sessionStorage.getItem('cashfree_order_data');
      if (!storedData) {
        toast.error('Order data not found');
        navigate('/');
        return;
      }

      const orderData = JSON.parse(storedData);
      
      console.log('Verifying Cashfree payment:', {
        orderId: cashfreeOrderId,
        paymentId: cashfreePaymentId,
        actualPaymentId,
        isPlaceholder: cashfreePaymentId === '{payment_id}'
      });

      console.log('Cashfree payment details:', {
        cashfreeOrderId,
        cashfreePaymentId,
        actualPaymentId,
        isPlaceholder: cashfreePaymentId === '{payment_id}'
      });

      // If payment ID is a placeholder, try to get payment details from Cashfree API
      let finalPaymentId = actualPaymentId;
      let verification = { success: false };
      
      if (!actualPaymentId) {
        // Payment ID is a placeholder - try to fetch payment details from Cashfree using order ID
        console.log('Payment ID is placeholder, fetching payment details from Cashfree API...');
        try {
          // Try to verify with order ID only (backend will fetch payment details)
          verification = await paymentService.verifyCashfreePayment(
            cashfreeOrderId,
            'placeholder' // Backend will handle this
          );
          // If verification succeeds, extract payment ID from response
          if (verification.success && verification.data?.paymentId) {
            finalPaymentId = verification.data.paymentId;
            console.log('Retrieved payment ID from Cashfree API:', finalPaymentId);
          }
        } catch (error) {
          console.error('Failed to fetch payment details from Cashfree:', error);
          // Continue anyway - Cashfree only redirects on success
        }
      } else {
        // We have actual payment ID, verify normally
        try {
          verification = await paymentService.verifyCashfreePayment(
            cashfreeOrderId,
            actualPaymentId
          );
        } catch (error) {
          console.error('Payment verification error:', error);
          // Continue with order creation if we have payment ID from URL
        }
      }

      // If verification succeeds, or if we have order_id from redirect (Cashfree only redirects on success)
      // proceed with order creation even if payment ID is missing
      if (verification.success || cashfreeOrderId) {
        // Create order with payment details
        const orderPayload = {
          orderItems: orderData.orderItems.map(item => {
            const productId = item.product || item.productId || item.product?._id || item.product?.id || item.id;
            return {
              product: productId,
              productId: productId,
              name: item.name || 'Product',
              quantity: Number(item.quantity) || 1,
              price: Number(item.selectedPrice) || Number(item.price) || 699,
              selectedPrice: Number(item.selectedPrice) || Number(item.price) || 699,
              size: item.size || null,
              image: item.image || null
            };
          }),
          shippingAddress: {
            type: 'home',
            name: orderData.deliveryAddress.name,
            phone: orderData.deliveryAddress.phone,
            address: orderData.deliveryAddress.address,
            city: orderData.deliveryAddress.city,
            state: orderData.deliveryAddress.state,
            pincode: orderData.deliveryAddress.pincode
          },
          paymentMethod: 'online',
          itemsPrice: Number(orderData.totalPrice) || 0,
          shippingPrice: Number(orderData.shipping) || 0,
          discountPrice: Number(orderData.discount) || 0,
          totalPrice: Number(orderData.finalTotal) || 0,
          coupon: orderData.couponCode ? { code: orderData.couponCode } : null,
          cashfree: {
            orderId: cashfreeOrderId,
            paymentId: actualPaymentId || null
          },
          paymentGateway: 'cashfree'
        };

        const result = await orderService.createOrder(orderPayload);

        if (result.success) {
          clearCart();
          sessionStorage.removeItem('cashfree_order_data');
          
          // Store order data in sessionStorage before reload so it persists
          const successOrderData = {
            order: result.data,
            orderId: result.data._id || result.data.orderNumber,
            orderItems: orderData.orderItems,
            totalPrice: orderData.totalPrice,
            shipping: orderData.shipping,
            discount: orderData.discount,
            finalTotal: orderData.finalTotal,
            paymentMethod: 'online',
            couponCode: orderData.couponCode,
            deliveryAddress: orderData.deliveryAddress
          };
          sessionStorage.setItem('order_success_data', JSON.stringify(successOrderData));
          
          toast.success('Order placed successfully!');
          
          // Navigate to order success page with order data in state
          navigate('/order-success', { 
            state: successOrderData,
            replace: true 
          });
        } else {
          throw new Error('Failed to create order');
        }
      } else {
        // If verification explicitly failed and we don't have payment_id, show error
        throw new Error('Payment verification failed');
      }
    } catch (error) {
      console.error('Cashfree callback error:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        error: error,
        orderId: cashfreeOrderId,
        paymentId: cashfreePaymentId,
        actualPaymentId: actualPaymentId,
        response: error.response?.data,
        responseStatus: error.response?.status,
        responseStatusText: error.response?.statusText
      });
      
      // Extract error message
      let errorMessage = 'Payment processing failed';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Don't create duplicate order in catch block - order should already be created in try block if successful
      // If we reach here, it means order creation failed, so just show error
      
      toast.error(errorMessage);
      sessionStorage.removeItem('cashfree_order_data');
      
      // Don't navigate away if it's just a verification issue - show error but stay on page
      // navigate('/payment', { state: orderData });
    } finally {
      setIsProcessingCashfree(false);
    }
  };

  // Save order when component mounts (for non-Cashfree orders)
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const gateway = urlParams.get('gateway');
    
    // Skip if this is a Cashfree callback (handled separately)
    if (gateway === 'cashfree') {
      return;
    }

    if (orderItems && orderItems.length > 0) {
      const orderToSave = {
        items: orderItems.map(item => ({
          ...item,
          image: getSafeImage(item.image || item.product?.image || item.product?.images?.[0]),
          price: item.selectedPrice || item.price || 699
        })),
        itemsPrice: totalPrice,
        shippingPrice: shipping,
        discountPrice: discount || 0,
        totalPrice: finalTotal,
        paymentMethod,
        coupon: couponCode ? { code: couponCode } : null,
        deliveryAddress: deliveryAddress || {
          name: 'Hriti Singh',
          phone: '+91 9876543210',
          address: '123, Main Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001'
        }
      };
      
      addOrder(orderToSave);
    }
  }, [orderItems, totalPrice, shipping, discount, finalTotal, paymentMethod, couponCode, deliveryAddress, location.search]);
  if (isProcessingCashfree) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center pb-20 md:pb-0">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#D4AF37] border-t-transparent mx-auto mb-6"></div>
          <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Processing Your Payment...</h2>
          <p className="text-gray-400 text-sm md:text-base">Please wait while we verify your payment</p>
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
              onClick={() => navigate('/')}
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
                Order Confirmed
              </h1>
            </div>

            <div className="w-10"></div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 md:px-6 py-8 md:py-12 max-w-2xl">
        {/* Success Icon */}
        <div className="text-center mb-6 md:mb-8">
          <div className="w-20 h-20 md:w-24 md:h-24 mx-auto bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mb-4 md:mb-6 shadow-lg">
            <svg className="w-12 h-12 md:w-16 md:h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Order Placed Successfully!
          </h2>
          <p className="text-gray-400 text-sm md:text-base">
            Thank you for your purchase
          </p>
        </div>

        {/* Order Details Card */}
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl md:rounded-2xl p-5 md:p-6 border border-gray-800 shadow-xl mb-6">
          <h3 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6">
            Order Details
          </h3>

          <div className="space-y-3 md:space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-800">
              <span className="text-gray-400 text-sm md:text-base">Order ID</span>
              <span className="text-white font-bold text-sm md:text-base">{orderId}</span>
            </div>

            <div className="flex justify-between items-center pb-3 border-b border-gray-800">
              <span className="text-gray-400 text-sm md:text-base">Payment Method</span>
              <span className="text-[#D4AF37] font-semibold text-sm md:text-base capitalize">
                {paymentMethod === 'online' || paymentMethod === 'card' ? 'Online Payment' : paymentMethod === 'upi' ? 'UPI' : paymentMethod === 'cod' ? 'Cash on Delivery' : 'Cash on Delivery'}
              </span>
            </div>

            <div className="flex justify-between items-center pb-3 border-b border-gray-800">
              <span className="text-gray-400 text-sm md:text-base">Total Items</span>
              <span className="text-white font-semibold text-sm md:text-base">
                {orderItems.length} {orderItems.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-lg md:text-xl font-bold text-white">Total Amount</span>
              <span className="text-xl md:text-2xl font-bold text-[#D4AF37]">
                ₹{finalTotal.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 md:space-y-4">
          <button
            onClick={() => navigate('/orders')}
            className="w-full bg-[#D4AF37] hover:bg-[#F4D03F] text-black font-bold px-6 md:px-8 py-3 md:py-4 rounded-lg text-base md:text-lg transition-all duration-300 shadow-lg flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>View Orders</span>
          </button>

          <button
            onClick={() => navigate('/products')}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white font-medium px-6 md:px-8 py-3 md:py-4 rounded-lg text-base md:text-lg transition-all duration-300"
          >
            Continue Shopping
          </button>
        </div>
      </div>

      <BottomNavbar />
    </div>
  );
};

export default OrderSuccess;

