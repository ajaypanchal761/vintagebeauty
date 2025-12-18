const Order = require('../model/Order');
const Product = require('../model/Product');
const Cart = require('../model/Cart');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res, next) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      discountPrice,
      totalPrice,
      coupon,
      razorpay,
      cashfree,
      paymentGateway
    } = req.body;

    // Validate required fields
    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order items are required'
      });
    }

    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address is required'
      });
    }

    // Validate shipping address fields (check for empty strings too)
    if (!shippingAddress.name || !shippingAddress.name.trim() || 
        !shippingAddress.phone || !shippingAddress.phone.trim() || 
        !shippingAddress.address || !shippingAddress.address.trim() || 
        !shippingAddress.city || !shippingAddress.city.trim() || 
        !shippingAddress.state || !shippingAddress.state.trim() || 
        !shippingAddress.pincode || !shippingAddress.pincode.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Complete shipping address is required (name, phone, address, city, state, pincode)',
        details: {
          name: !shippingAddress.name || !shippingAddress.name.trim(),
          phone: !shippingAddress.phone || !shippingAddress.phone.trim(),
          address: !shippingAddress.address || !shippingAddress.address.trim(),
          city: !shippingAddress.city || !shippingAddress.city.trim(),
          state: !shippingAddress.state || !shippingAddress.state.trim(),
          pincode: !shippingAddress.pincode || !shippingAddress.pincode.trim()
        }
      });
    }

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Payment method is required'
      });
    }

    // Validate order items
    for (const item of orderItems) {
      const productId = item.product || item.productId;
      if (!productId) {
        return res.status(400).json({
          success: false,
          message: `Product ID is required for item: ${item.name || 'Unknown'}`
        });
      }

      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product ${productId} not found`
        });
      }

      const quantity = Number(item.quantity) || 1;
      if (quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid quantity for ${product.name}`
        });
      }

      if (product.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${quantity}`
        });
      }
    }

    // Normalize payment method (card/upi -> online)
    const normalizedPaymentMethod = (paymentMethod === 'card' || paymentMethod === 'upi') ? 'online' : paymentMethod;
    
    // Determine payment status based on payment method
    let paymentStatus = 'pending';
    if (normalizedPaymentMethod === 'cod') {
      paymentStatus = 'pending';
    } else if (normalizedPaymentMethod === 'online' && razorpay && razorpay.paymentId) {
      // Only mark as completed if payment ID exists (payment was successful)
      paymentStatus = 'completed';
    } else if (normalizedPaymentMethod === 'online' && cashfree && cashfree.paymentId && cashfree.paymentId !== '{payment_id}') {
      // Mark as completed if Cashfree payment ID exists and is not a placeholder
      paymentStatus = 'completed';
    } else if (normalizedPaymentMethod === 'online') {
      paymentStatus = 'pending';
    }

    // Create order
    const orderData = {
      user: req.user._id,
      orderItems: orderItems.map(item => ({
        product: item.product || item.productId,
        name: item.name || 'Product',
        quantity: Number(item.quantity) || 1,
        price: Number(item.price) || Number(item.selectedPrice) || 0,
        size: item.size || null,
        selectedPrice: Number(item.selectedPrice) || Number(item.price) || 0,
        image: item.image || null
      })),
      shippingAddress: {
        type: shippingAddress.type || 'home',
        name: shippingAddress.name,
        phone: shippingAddress.phone,
        address: shippingAddress.address,
        city: shippingAddress.city,
        state: shippingAddress.state,
        pincode: shippingAddress.pincode
      },
      paymentMethod: normalizedPaymentMethod,
      itemsPrice: Number(itemsPrice) || 0,
      shippingPrice: Number(shippingPrice) || 0,
      discountPrice: Number(discountPrice) || 0,
      totalPrice: Number(totalPrice) || 0,
      coupon: coupon || null,
      paymentStatus,
      orderStatus: paymentStatus === 'completed' ? 'confirmed' : 'pending'
    };

    // Add payment gateway details if available
    if (razorpay && razorpay.orderId) {
      orderData.razorpay = {
        orderId: razorpay.orderId,
        paymentId: razorpay.paymentId || null,
        signature: razorpay.signature || null
      };
      orderData.paymentGateway = paymentGateway || 'razorpay';
    } else if (cashfree && cashfree.orderId) {
      orderData.cashfree = {
        orderId: cashfree.orderId,
        paymentId: cashfree.paymentId || null,
        paymentSessionId: cashfree.paymentSessionId || null
      };
      orderData.paymentGateway = paymentGateway || 'cashfree';
    } else {
      // Set default gateway
      orderData.paymentGateway = paymentGateway || 'razorpay';
    }

    const order = await Order.create(orderData);

    // Update product stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product || item.productId, {
        $inc: { stock: -item.quantity }
      });
    }

    // Clear cart if order is successful
    // Use updateOne to avoid version conflicts (direct database update)
    await Cart.updateOne(
      { user: req.user._id },
      { 
        $set: { 
          items: [],
          coupon: null
        }
      }
    );

    await order.populate('orderItems.product', 'name images');

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    console.error('Create order error:', error);
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message).join(', ');
      return res.status(400).json({
        success: false,
        message: `Validation error: ${messages}`,
        error: error.message
      });
    }
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Order number already exists',
        error: error.message
      });
    }
    next(error);
  }
};

// @desc    Get user orders
// @route   GET /api/orders
// @access  Private
exports.getUserOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('orderItems.product', 'name images')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('orderItems.product', 'name images price')
      .populate('user', 'name email phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this order'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }

    if (['shipped', 'delivered', 'cancelled'].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled at this stage'
      });
    }

    order.cancellationStatus = 'requested';
    order.cancellationReason = req.body.reason || 'Cancelled by user';
    await order.save();

    // Restore product stock
    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity }
      });
    }

    // Emit Socket.IO event for real-time cancellation status update
    const io = req.app.get('io');
    if (io) {
      const orderRoom = `order-${order._id}`;
      const userRoom = `user-${order.user}`;
      
      const notificationData = {
        orderId: order._id.toString(),
        orderStatus: order.orderStatus,
        cancellationStatus: order.cancellationStatus,
        cancellationReason: order.cancellationReason,
        trackingHistory: order.trackingHistory,
        updatedAt: order.updatedAt
      };

      io.to(orderRoom).emit('order-status-updated', notificationData);
      io.to(userRoom).emit('order-status-updated', notificationData);
    }

    res.status(200).json({
      success: true,
      message: 'Cancellation request submitted',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders/admin/all
// @access  Private/Admin
exports.getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email phone')
      .populate('orderItems.product', 'name images')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status (Admin)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { orderStatus } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.orderStatus = orderStatus;

    // Update tracking history based on status - map orderStatus to tracking history status names
    const statusToTrackingMap = {
      'confirmed': 'Confirmed',
      'processing': 'Processing',
      'shipped': 'Shipped',
      'out-for-delivery': 'Out for Delivery',
      'delivered': 'Delivered'
    };

    // Define the order of statuses for proper progression
    const statusOrder = ['Order Placed', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'];

    if (order.trackingHistory && order.trackingHistory.length > 0) {
      const targetStatusName = statusToTrackingMap[orderStatus.toLowerCase()];
      
      if (targetStatusName) {
        const targetIndex = statusOrder.indexOf(targetStatusName);
        
        // Update tracking history: mark target status and all previous statuses as completed
        order.trackingHistory = order.trackingHistory.map((track) => {
          const trackIndex = statusOrder.indexOf(track.status);
          
          // If this status is at or before the target status, mark it as completed
          if (trackIndex >= 0 && trackIndex <= targetIndex) {
            return {
              ...track,
              completed: true,
              date: track.date || new Date() // Only set date if not already set
            };
          }
          
          return track;
        });
      }
    }

    // Update revenue status based on order status
    if (orderStatus === 'delivered') {
      if (order.paymentMethod === 'cod') {
        order.revenueStatus = 'earned';
      } else if (order.paymentMethod === 'online' && order.paymentStatus === 'completed') {
        order.revenueStatus = 'confirmed';
      }
    } else if (orderStatus === 'confirmed' && order.paymentMethod === 'online' && order.paymentStatus === 'completed') {
      order.revenueStatus = 'confirmed';
    }

    await order.save();

    // Emit Socket.IO event for real-time status update
    // Send to both order-specific room and user-specific room for reliability
    const io = req.app.get('io');
    if (io) {
      const orderRoom = `order-${order._id}`;
      const userRoom = `user-${order.user}`;
      
      const notificationData = {
        orderId: order._id.toString(),
        orderStatus: order.orderStatus,
        trackingHistory: order.trackingHistory,
        updatedAt: order.updatedAt
      };

      // Emit to order room (for users who joined this specific order)
      io.to(orderRoom).emit('order-status-updated', notificationData);
      
      // Emit to user room (for the order owner - more reliable)
      io.to(userRoom).emit('order-status-updated', notificationData);
    }

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Handle cancellation request (Admin)
// @route   PUT /api/orders/:id/cancellation
// @access  Private/Admin
exports.handleCancellationRequest = async (req, res, next) => {
  try {
    const { action, reasonForRejection } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (action === 'approve') {
      order.cancellationStatus = 'approved';
      order.orderStatus = 'cancelled';
      order.cancelledAt = new Date();
      order.cancellationApprovedBy = req.admin.name;

      if (order.paymentMethod === 'online' && order.paymentStatus === 'completed') {
        order.refundStatus = 'pending';
        order.refundAmount = order.totalPrice;
      }

      // Restore product stock
      for (const item of order.orderItems) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity }
        });
      }
    } else if (action === 'reject') {
      order.cancellationStatus = 'rejected';
      order.cancellationRejectionReason = reasonForRejection || 'Cancellation request rejected by admin';
    }

    await order.save();

    // Emit Socket.IO event for real-time cancellation status update
    const io = req.app.get('io');
    if (io) {
      const orderRoom = `order-${order._id}`;
      const userRoom = `user-${order.user}`;
      
      const notificationData = {
        orderId: order._id.toString(),
        orderStatus: order.orderStatus,
        cancellationStatus: order.cancellationStatus,
        cancellationReason: order.cancellationReason,
        refundStatus: order.refundStatus,
        refundAmount: order.refundAmount,
        trackingHistory: order.trackingHistory,
        updatedAt: order.updatedAt
      };

      io.to(orderRoom).emit('order-status-updated', notificationData);
      io.to(userRoom).emit('order-status-updated', notificationData);
    }

    res.status(200).json({
      success: true,
      message: `Cancellation ${action}ed successfully`,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Process refund (Admin)
// @route   PUT /api/orders/:id/refund
// @access  Private/Admin
exports.processRefund = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.paymentMethod !== 'online' || order.paymentStatus !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Refund can only be processed for online orders with completed payment'
      });
    }

    if (order.refundStatus === 'processed' || order.refundStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Refund has already been processed'
      });
    }

    order.refundStatus = 'completed';
    order.refundAmount = order.totalPrice;
    order.refundProcessedAt = new Date();
    order.refundProcessedBy = req.admin.name;

    // Update revenue status
    order.revenueStatus = 'pending';
    order.paymentStatus = 'refunded';

    await order.save();

    // Emit Socket.IO event for real-time refund status update
    const io = req.app.get('io');
    if (io) {
      const orderRoom = `order-${order._id}`;
      const userRoom = `user-${order.user}`;
      
      const notificationData = {
        orderId: order._id.toString(),
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        refundStatus: order.refundStatus,
        refundAmount: order.refundAmount,
        trackingHistory: order.trackingHistory,
        updatedAt: order.updatedAt
      };

      io.to(orderRoom).emit('order-status-updated', notificationData);
      io.to(userRoom).emit('order-status-updated', notificationData);
    }

    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        order,
        refundAmount: order.refundAmount
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Confirm COD receipt (Admin)
// @route   PUT /api/orders/:id/confirm-cod
// @access  Private/Admin
exports.confirmCODReceipt = async (req, res, next) => {
  try {
    const { confirmedAmount } = req.body;

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.paymentMethod !== 'cod') {
      return res.status(400).json({
        success: false,
        message: 'This order is not a COD order'
      });
    }

    if (!confirmedAmount || confirmedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid confirmed amount'
      });
    }

    order.revenueStatus = 'confirmed';
    order.revenueAmount = confirmedAmount;
    order.paymentStatus = 'completed';
    order.codConfirmedAt = new Date();
    order.codConfirmedBy = req.admin.name;

    await order.save();

    res.status(200).json({
      success: true,
      message: 'COD payment confirmed successfully',
      data: {
        order,
        confirmedAmount: order.revenueAmount
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Track order by order number or tracking number (Public)
// @route   GET /api/orders/track/:identifier
// @access  Public
exports.trackOrder = async (req, res, next) => {
  try {
    const { identifier } = req.params;
    const { phone } = req.query; // Optional phone verification

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: 'Order number or tracking number is required'
      });
    }

    // Search by order number or tracking number
    const order = await Order.findOne({
      $or: [
        { orderNumber: identifier },
        { trackingNumber: identifier }
      ]
    })
      .populate('orderItems.product', 'name images price')
      .populate('user', 'name email phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found. Please check your order number or tracking number.'
      });
    }

    // Optional phone verification for security
    if (phone && order.user && order.user.phone) {
      const orderPhone = order.user.phone.replace(/\D/g, '');
      const providedPhone = phone.replace(/\D/g, '');
      
      if (orderPhone !== providedPhone && !orderPhone.endsWith(providedPhone) && !providedPhone.endsWith(orderPhone)) {
        return res.status(403).json({
          success: false,
          message: 'Phone number does not match. Please provide the correct phone number associated with this order.'
        });
      }
    }

    // Don't send sensitive user data
    const orderData = order.toObject();
    if (orderData.user) {
      orderData.user = {
        name: orderData.user.name,
        phone: orderData.user.phone ? orderData.user.phone.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2') : null // Mask phone number
      };
    }

    res.status(200).json({
      success: true,
      data: orderData
    });
  } catch (error) {
    next(error);
  }
};

