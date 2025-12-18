import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import BottomNavbar from './BottomNavbar';
import logo from '../assets/logo vintage.png';
import heroimg from '../assets/heroimg.png';
import paymentService from '../services/paymentService';
import orderService from '../services/orderService';
import { products } from '../api';
import toast from 'react-hot-toast';

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearCart } = useCartStore();
  
  const orderData = location.state || {
    orderItems: [],
    totalPrice: 0,
    shipping: 0,
    discount: 0,
    finalTotal: 0,
    itemCount: 0,
    couponCode: null,
    deliveryAddress: null
  };

  const { orderItems, totalPrice, shipping, discount, finalTotal, itemCount, couponCode, deliveryAddress: orderDataAddress, paymentGateway: orderDataGateway } = orderData;
  const [deliveryAddress, setDeliveryAddress] = useState(orderDataAddress);

  const [paymentGateway, setPaymentGateway] = useState(orderDataGateway || 'razorpay'); // 'razorpay' or 'cashfree'
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: ''
  });
  const [upiId, setUpiId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [stockValidation, setStockValidation] = useState({
    isValidating: false,
    isValid: true,
    invalidProducts: []
  });

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

  // Validate stock for all products in order
  const validateStock = useCallback(async () => {
    if (!orderItems || orderItems.length === 0) {
      setStockValidation({ isValidating: false, isValid: true, invalidProducts: [] });
      return true;
    }

    setStockValidation({ isValidating: true, isValid: true, invalidProducts: [] });

    try {
      const invalidProducts = [];
      
      // Check stock for each product
      for (const item of orderItems) {
        const productId = item.product || item.productId || item.product?._id || item.product?.id || item.id;
        
        if (!productId) {
          continue; // Skip if no product ID
        }

        try {
          // Use centralized API - fetch product from database
          const productResponse = await products.getById(productId);
          const product = productResponse.data || productResponse;
          
          if (product) {
            const requestedQuantity = Number(item.quantity) || 1;
            const availableStock = Number(product.stock) || 0;
            const isInStock = product.inStock !== false && availableStock > 0;
            
            // Check if product is out of stock or insufficient stock
            if (!isInStock || availableStock < requestedQuantity) {
              invalidProducts.push({
                productId: productId,
                name: item.name || product.name || 'Product',
                requestedQuantity,
                availableStock,
                isOutOfStock: !isInStock || availableStock === 0
              });
            }
          }
        } catch (error) {
          console.error(`Error checking stock for product ${productId}:`, error);
          // If we can't verify stock, allow payment but log the error
          // This prevents blocking payment due to API errors
        }
      }

      if (invalidProducts.length > 0) {
        setStockValidation({
          isValidating: false,
          isValid: false,
          invalidProducts
        });
        return false;
      }

      setStockValidation({ isValidating: false, isValid: true, invalidProducts: [] });
      return true;
    } catch (error) {
      console.error('Stock validation error:', error);
      // On error, allow payment to proceed (don't block due to validation errors)
      setStockValidation({ isValidating: false, isValid: true, invalidProducts: [] });
      return true;
    }
  }, [orderItems]);

  // Validate stock when component loads or orderItems change
  useEffect(() => {
    if (orderItems && orderItems.length > 0) {
      validateStock();
    }
  }, [orderItems, validateStock]);

  const handlePayment = async () => {
    setIsProcessing(true);
    setError('');

    try {
      // Validate stock before proceeding with payment
      const isStockValid = await validateStock();
      
      if (!isStockValid) {
        const outOfStockProducts = stockValidation.invalidProducts.filter(p => p.isOutOfStock);
        const lowStockProducts = stockValidation.invalidProducts.filter(p => !p.isOutOfStock);
        
        let errorMessage = '⚠️ Cannot proceed with payment:\n\n';
        
        if (outOfStockProducts.length > 0) {
          errorMessage += '❌ Out of Stock:\n';
          outOfStockProducts.forEach(product => {
            errorMessage += `• ${product.name}\n`;
          });
          errorMessage += '\n';
        }
        
        if (lowStockProducts.length > 0) {
          errorMessage += '⚠️ Insufficient Stock:\n';
          lowStockProducts.forEach(product => {
            errorMessage += `• ${product.name} - Requested: ${product.requestedQuantity}, Available: ${product.availableStock}\n`;
          });
        }
        
        errorMessage += '\nPlease remove these items from your cart or reduce quantities to proceed.';
        
        toast.error(errorMessage, {
          duration: 6000,
          style: {
            maxWidth: '500px',
            whiteSpace: 'pre-line'
          }
        });
        
        setError('Some products are out of stock or have insufficient stock. Please check your cart.');
        setIsProcessing(false);
        return;
      }

      // Handle COD payment
      if (paymentMethod === 'cod') {
        await createOrder('cod');
        return;
      }

      // Handle online payment (card/upi) - route based on selected gateway
      if (paymentMethod === 'card' || paymentMethod === 'upi') {
        if (paymentGateway === 'razorpay') {
          // Razorpay payment flow
          const razorpayOrder = await paymentService.createRazorpayOrder(
            finalTotal,
            `order_${Date.now()}`
          );

          if (!razorpayOrder.success || !razorpayOrder.data) {
            throw new Error('Failed to create payment order');
          }

          const { orderId, keyId } = razorpayOrder.data;

          // Initialize Razorpay checkout
          const options = {
            key: keyId,
            amount: Math.round(finalTotal * 100), // Amount in paise
            currency: 'INR',
            name: 'APM Beauty and Perfume',
            description: `Order for ${itemCount} item(s)`,
            order_id: orderId,
            handler: async function (response) {
              try {
                setIsProcessing(true);
                
                // Verify payment
                const verification = await paymentService.verifyPayment(
                  response.razorpay_order_id,
                  response.razorpay_payment_id,
                  response.razorpay_signature
                );

                if (verification.success) {
                  // Create order with payment details
                  await createOrder('online', {
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature
                  }, 'razorpay');
                } else {
                  throw new Error('Payment verification failed');
                }
              } catch (error) {
                console.error('Payment verification error:', error);
                toast.error(error.message || 'Payment verification failed');
                setIsProcessing(false);
              }
            },
            prefill: {
              name: deliveryAddress?.name || '',
              email: '',
              contact: deliveryAddress?.phone || ''
            },
            theme: {
              color: '#D4AF37'
            },
            modal: {
              ondismiss: function() {
                setIsProcessing(false);
              }
            }
          };

          const razorpay = new window.Razorpay(options);
          razorpay.on('payment.failed', function (response) {
            console.error('Payment failed:', response);
            toast.error('Payment failed. Please try again.');
            setIsProcessing(false);
            setError(response.error.description || 'Payment failed');
          });

          razorpay.open();
        } else if (paymentGateway === 'cashfree') {
          // Cashfree payment flow
          const orderId = `order_${Date.now()}`;
          
          // Create Cashfree payment session
          const cashfreeSession = await paymentService.createCashfreeSession(
            finalTotal,
            orderId,
            {
              customerId: deliveryAddress?.phone || `customer_${Date.now()}`,
              name: deliveryAddress?.name || '',
              email: '',
              phone: deliveryAddress?.phone || ''
            }
          );

          if (!cashfreeSession.success || !cashfreeSession.data) {
            throw new Error('Failed to create Cashfree payment session');
          }

          const { paymentSessionId, appId } = cashfreeSession.data;

          // Store order data temporarily for Cashfree callback
          sessionStorage.setItem('cashfree_order_data', JSON.stringify({
            orderItems,
            totalPrice,
            shipping,
            discount,
            finalTotal,
            itemCount,
            couponCode,
            deliveryAddress,
            orderId
          }));

          // Load Cashfree Checkout SDK if not already loaded
          if (!window.cashfree) {
            const script = document.createElement('script');
            script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
            script.onload = () => {
              initializeCashfreeCheckout(paymentSessionId, appId, orderId);
            };
            script.onerror = () => {
              toast.error('Failed to load Cashfree SDK');
              setIsProcessing(false);
              setError('Failed to load payment gateway');
            };
            document.body.appendChild(script);
          } else {
            initializeCashfreeCheckout(paymentSessionId, appId, orderId);
          }
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Payment processing failed');
      setError(error.message || 'Payment processing failed');
      setIsProcessing(false);
    }
  };

  // Initialize Cashfree Checkout
  const initializeCashfreeCheckout = async (paymentSessionId, appId, orderId) => {
    try {
      setIsProcessing(true);
      
      // Cashfree Checkout SDK
      const cashfree = new window.Cashfree({
        mode: import.meta.env.VITE_CASHFREE_MODE || 'sandbox' // 'sandbox' or 'production'
      });

      cashfree.checkout({
        paymentSessionId: paymentSessionId,
        redirectTarget: '_self'
      }).then((result) => {
        if (result.error) {
          console.error('Cashfree payment error:', result.error);
          toast.error(result.error.message || 'Payment failed');
          setIsProcessing(false);
          setError(result.error.message || 'Payment failed');
          sessionStorage.removeItem('cashfree_order_data');
        } else {
          // Payment successful - Cashfree will redirect to return URL
          // The return URL (order-success) will handle payment verification and order creation
          console.log('Cashfree payment initiated, redirecting...');
        }
      }).catch((error) => {
        console.error('Cashfree checkout error:', error);
        toast.error('Payment initialization failed');
        setIsProcessing(false);
        setError('Payment initialization failed');
        sessionStorage.removeItem('cashfree_order_data');
      });
    } catch (error) {
      console.error('Cashfree initialization error:', error);
      toast.error('Failed to initialize payment gateway');
      setIsProcessing(false);
      setError('Failed to initialize payment gateway');
      sessionStorage.removeItem('cashfree_order_data');
    }
  };

  const createOrder = async (paymentMethodType, paymentDetails = null, gateway = 'razorpay') => {
    try {
      // Validate order items
      if (!orderItems || orderItems.length === 0) {
        throw new Error('No items in order');
      }

      // Validate shipping address
      if (!deliveryAddress) {
        throw new Error('Please provide a delivery address');
      }
      
      if (!deliveryAddress.name || !deliveryAddress.phone || 
          !deliveryAddress.address || !deliveryAddress.city || 
          !deliveryAddress.state || !deliveryAddress.pincode) {
        throw new Error('Please provide complete shipping address (name, phone, address, city, state, pincode)');
      }

      // Prepare order data
      const orderData = {
        orderItems: orderItems.map(item => {
          const productId = item.product || item.productId || item.product?._id || item.product?.id || item.id;
          if (!productId) {
            throw new Error(`Invalid product ID for item: ${item.name || 'Unknown'}`);
          }
          return {
            product: productId,
            productId: productId,
            name: item.name || 'Product',
            quantity: Number(item.quantity) || 1,
            price: Number(item.selectedPrice) || Number(item.price) || 699,
            selectedPrice: Number(item.selectedPrice) || Number(item.price) || 699,
            size: item.size || null,
            image: getSafeImage(item.image || item.product?.image || item.product?.images?.[0])
          };
        }),
        shippingAddress: {
          type: 'home',
          name: deliveryAddress.name,
          phone: deliveryAddress.phone,
          address: deliveryAddress.address,
          city: deliveryAddress.city,
          state: deliveryAddress.state,
          pincode: deliveryAddress.pincode
        },
        paymentMethod: paymentMethodType,
        itemsPrice: Number(totalPrice) || 0,
        shippingPrice: Number(shipping) || 0,
        discountPrice: Number(discount) || 0,
        totalPrice: Number(finalTotal) || 0,
        coupon: couponCode ? { code: couponCode } : null
      };

      // Add payment gateway details if available
      if (paymentDetails) {
        if (gateway === 'razorpay') {
          orderData.razorpay = {
            orderId: paymentDetails.razorpay_order_id,
            paymentId: paymentDetails.razorpay_payment_id,
            signature: paymentDetails.razorpay_signature
          };
        } else if (gateway === 'cashfree') {
          orderData.cashfree = {
            orderId: paymentDetails.cashfree_order_id,
            paymentId: paymentDetails.cashfree_payment_id,
            paymentSessionId: paymentDetails.cashfree_payment_session_id
          };
        }
        orderData.paymentGateway = gateway;
      } else {
        // Set default gateway for COD
        orderData.paymentGateway = gateway;
      }

      // Create order
      const result = await orderService.createOrder(orderData);

      if (result.success) {
        clearCart();
        toast.success('Order placed successfully!');
        navigate('/order-success', {
          state: {
            order: result.data, // Pass the full order object from backend
            orderId: result.data._id || result.data.orderNumber,
            orderItems,
            totalPrice,
            shipping,
            discount,
            finalTotal,
            paymentMethod: result.data.paymentMethod || paymentMethodType, // Use backend paymentMethod if available
            couponCode,
            deliveryAddress
          }
        });
      } else {
        throw new Error('Failed to create order');
      }
    } catch (error) {
      console.error('Create order error:', error);
      
      // Handle 404 - route not found (backend might not be running)
      if (error.response?.status === 404 && !error.response?.data?.message) {
        const errorMessage = 'Backend server is not responding. Please check if the server is running.';
        toast.error(errorMessage);
        setError(errorMessage);
        setIsProcessing(false);
        return;
      }
      
      // Handle product not found errors
      if (error.response?.status === 404 && error.response?.data?.message?.includes('not found')) {
        const errorMessage = error.response.data.message;
        toast.error(errorMessage + '. Please remove this product from your cart and try again.');
        setError(errorMessage);
        setIsProcessing(false);
        // Redirect to cart after 2 seconds
        setTimeout(() => {
          navigate('/cart');
        }, 2000);
        return;
      }
      
      // Handle other errors
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create order';
      const errorDetails = error.response?.data?.error || '';
      toast.error(errorMessage + (errorDetails ? `: ${errorDetails}` : ''));
      setError(errorMessage);
      setIsProcessing(false);
    }
  };

  if (orderItems.length === 0) {
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
                Payment
              </h1>
              <div className="w-10"></div>
            </div>
          </div>
        </nav>

        <div className="container mx-auto px-4 md:px-6 py-12 md:py-20 max-w-2xl">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">No order found</h2>
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
              onClick={() => navigate('/order-summary')}
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
                Payment
              </h1>
            </div>

            <div className="w-10"></div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 md:px-6 py-4 md:py-8 max-w-4xl">
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {/* Payment Methods & Form */}
          <div className="md:col-span-2 space-y-6">
            {/* Order Items Summary */}
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl md:rounded-2xl p-4 md:p-6 border border-gray-800">
              <h3 className="text-lg md:text-xl font-bold text-white mb-4">
                Order Items ({itemCount} {itemCount === 1 ? 'item' : 'items'})
              </h3>
              <div className="space-y-3">
                {orderItems.map((item, index) => {
                  const itemPrice = item.selectedPrice || item.price || 699;
                  const itemTotal = itemPrice * item.quantity;
                  const productId = item.product || item.productId || item.product?._id || item.product?.id || item.id;
                  const productImage = item.image || item.product?.image || item.product?.images?.[0] || heroimg;
                  
                  // Check if this item has stock issues
                  const stockIssue = stockValidation.invalidProducts.find(
                    p => p.productId === productId
                  );

                  return (
                    <div key={index} className={`flex items-center gap-3 pb-3 border-b border-gray-800 last:border-0 ${stockIssue ? 'bg-red-500/10 rounded-lg p-2 -mx-2' : ''}`}>
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                        <img
                          src={getSafeImage(productImage)}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm md:text-base font-semibold text-white truncate">
                            {item.name}
                          </h4>
                          {stockIssue && (
                            <span className="flex-shrink-0 px-2 py-0.5 bg-red-500/20 border border-red-500/50 rounded text-xs text-red-400 font-semibold">
                              {stockIssue.isOutOfStock ? 'Out of Stock' : 'Low Stock'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs md:text-sm text-gray-400">
                          {item.size} × {item.quantity}
                        </p>
                        {stockIssue && !stockIssue.isOutOfStock && (
                          <p className="text-xs text-red-400 mt-1">
                            Only {stockIssue.availableStock} available
                          </p>
                        )}
                      </div>
                      <p className="text-sm md:text-base font-bold text-[#D4AF37]">
                        ₹{itemTotal.toLocaleString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment Gateway Selection - Always Visible */}
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl md:rounded-2xl p-4 md:p-6 border border-gray-800 mb-4 md:mb-6">
              <h3 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6">
                Select Payment Gateway
              </h3>

              <div className="grid grid-cols-2 gap-3">
                {/* Razorpay Option */}
                <button
                  onClick={() => setPaymentGateway('razorpay')}
                  className={`p-4 rounded-lg border-2 transition-all duration-300 ${
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
                  className={`p-4 rounded-lg border-2 transition-all duration-300 ${
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

            {/* Payment Methods */}
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl md:rounded-2xl p-4 md:p-6 border border-gray-800">
              <h3 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6">
                Select Payment Method
              </h3>

              <div className="space-y-3">
                {/* Card Payment */}
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`w-full p-4 rounded-lg border-2 transition-all duration-300 ${
                    paymentMethod === 'card'
                      ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'card' ? 'border-[#D4AF37]' : 'border-gray-600'
                    }`}>
                      {paymentMethod === 'card' && (
                        <div className="w-3 h-3 rounded-full bg-[#D4AF37]"></div>
                      )}
                    </div>
                    <svg className="w-6 h-6 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <span className="text-white font-semibold">Credit/Debit Card</span>
                  </div>
                </button>

                {/* UPI Payment */}
                <button
                  onClick={() => setPaymentMethod('upi')}
                  className={`w-full p-4 rounded-lg border-2 transition-all duration-300 ${
                    paymentMethod === 'upi'
                      ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'upi' ? 'border-[#D4AF37]' : 'border-gray-600'
                    }`}>
                      {paymentMethod === 'upi' && (
                        <div className="w-3 h-3 rounded-full bg-[#D4AF37]"></div>
                      )}
                    </div>
                    <svg className="w-6 h-6 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span className="text-white font-semibold">UPI</span>
                  </div>
                </button>

                {/* Cash on Delivery */}
                <button
                  onClick={() => setPaymentMethod('cod')}
                  className={`w-full p-4 rounded-lg border-2 transition-all duration-300 ${
                    paymentMethod === 'cod'
                      ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === 'cod' ? 'border-[#D4AF37]' : 'border-gray-600'
                    }`}>
                      {paymentMethod === 'cod' && (
                        <div className="w-3 h-3 rounded-full bg-[#D4AF37]"></div>
                      )}
                    </div>
                    <svg className="w-6 h-6 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="text-white font-semibold">Cash on Delivery</span>
                  </div>
                </button>
              </div>

              {/* Payment Form */}
              {paymentMethod === 'card' && (
                <div className="mt-6 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-lg p-4">
                  <p className="text-sm md:text-base text-[#D4AF37]">
                    💳 You will be redirected to {paymentGateway === 'razorpay' ? 'Razorpay' : 'Cashfree'} secure payment gateway to complete your card payment
                  </p>
                </div>
              )}

              {paymentMethod === 'upi' && (
                <div className="mt-6 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-lg p-4">
                  <p className="text-sm md:text-base text-[#D4AF37]">
                    📱 You will be redirected to {paymentGateway === 'razorpay' ? 'Razorpay' : 'Cashfree'} secure payment gateway to complete your UPI payment
                  </p>
                </div>
              )}

              {paymentMethod === 'cod' && (
                <div className="mt-6 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-lg p-4">
                  <p className="text-sm md:text-base text-[#D4AF37]">
                    💰 Pay cash when your order is delivered
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="md:col-span-1">
            <div className="sticky top-24">
              <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl md:rounded-2xl p-5 md:p-6 border border-gray-800 shadow-xl">
                <h3 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6 pb-3 md:pb-4 border-b border-gray-800">
                  Order Summary
                </h3>

                <div className="space-y-3 md:space-y-4 mb-4 md:mb-6">
                  <div className="flex justify-between text-sm md:text-base">
                    <span className="text-gray-400">Subtotal</span>
                    <span className="text-white font-semibold">₹{totalPrice.toLocaleString()}</span>
                  </div>
                  
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

                  <div className="pt-3 md:pt-4 border-t border-gray-800">
                    <div className="flex justify-between items-center">
                      <span className="text-base md:text-lg font-bold text-white">Total</span>
                      <span className="text-xl md:text-2xl font-bold text-[#D4AF37]">
                        ₹{finalTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stock Validation Status */}
                {stockValidation.isValidating && (
                  <div className="mb-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                    <p className="text-blue-400 text-sm flex items-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Checking product availability...
                    </p>
                  </div>
                )}

                {/* Stock Error Message */}
                {!stockValidation.isValid && stockValidation.invalidProducts.length > 0 && (
                  <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                    <p className="text-red-400 text-sm font-semibold mb-2">⚠️ Stock Issue Detected:</p>
                    <ul className="text-red-300 text-xs space-y-1">
                      {stockValidation.invalidProducts.map((product, index) => (
                        <li key={index}>
                          {product.isOutOfStock ? (
                            <>❌ <strong>{product.name}</strong> - Out of Stock</>
                          ) : (
                            <>⚠️ <strong>{product.name}</strong> - Only {product.availableStock} available (Requested: {product.requestedQuantity})</>
                          )}
                        </li>
                      ))}
                    </ul>
                    <p className="text-red-300 text-xs mt-2">Please update your cart to proceed with payment.</p>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {/* Pay Button */}
                <button
                  onClick={handlePayment}
                  disabled={isProcessing || stockValidation.isValidating || !stockValidation.isValid}
                  className="w-full bg-gradient-to-r from-[#D4AF37] to-amber-500 hover:from-[#F4D03F] hover:to-amber-400 disabled:from-gray-700 disabled:to-gray-600 disabled:cursor-not-allowed text-black font-bold px-6 md:px-8 py-3 md:py-4 rounded-lg text-base md:text-lg transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-[1.02] flex items-center justify-center gap-3"
                >
                  {isProcessing ? (
                    <>
                      <svg className="animate-spin w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Processing...</span>
                    </>
                  ) : stockValidation.isValidating ? (
                    <>
                      <svg className="animate-spin w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Checking Stock...</span>
                    </>
                  ) : !stockValidation.isValid ? (
                    <>
                      <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>Stock Issue - Cannot Proceed</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Pay ₹{finalTotal.toLocaleString()}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNavbar />
    </div>
  );
};

export default Payment;

