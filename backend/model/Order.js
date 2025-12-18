const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true
  },
  size: {
    type: String
  },
  selectedPrice: {
    type: Number,
    required: true
  },
  image: {
    type: String
  }
});

const trackingHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    required: true
  },
  date: {
    type: Date
  },
  description: {
    type: String,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  }
});

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderNumber: {
    type: String,
    unique: true
  },
  orderItems: [orderItemSchema],
  shippingAddress: {
    type: {
      type: String,
      enum: ['home', 'work', 'other'],
      default: 'home'
    },
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    pincode: {
      type: String,
      required: true
    }
  },
  paymentMethod: {
    type: String,
    enum: ['cod', 'online', 'card', 'upi'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'out-for-delivery', 'delivered', 'cancelled'],
    default: 'pending'
  },
  trackingNumber: {
    type: String
  },
  trackingHistory: [trackingHistorySchema],
  cancellationStatus: {
    type: String,
    enum: ['none', 'requested', 'approved', 'rejected'],
    default: 'none'
  },
  cancellationReason: {
    type: String
  },
  cancellationRejectionReason: {
    type: String
  },
  cancelledAt: {
    type: Date
  },
  cancellationApprovedBy: {
    type: String
  },
  itemsPrice: {
    type: Number,
    required: true,
    default: 0
  },
  shippingPrice: {
    type: Number,
    required: true,
    default: 0
  },
  discountPrice: {
    type: Number,
    default: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    default: 0
  },
  coupon: {
    code: String,
    discount: Number
  },
  revenueStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'earned'],
    default: 'pending'
  },
  revenueAmount: {
    type: Number
  },
  refundStatus: {
    type: String,
    enum: ['none', 'pending', 'approved', 'rejected', 'processed', 'completed'],
    default: 'none'
  },
  refundAmount: {
    type: Number,
    default: 0
  },
  refundProcessedAt: {
    type: Date
  },
  refundProcessedBy: {
    type: String
  },
  codConfirmedAt: {
    type: Date
  },
  codConfirmedBy: {
    type: String
  },
  razorpay: {
    orderId: {
      type: String
    },
    paymentId: {
      type: String
    },
    signature: {
      type: String
    }
  },
  cashfree: {
    orderId: {
      type: String
    },
    paymentId: {
      type: String
    },
    paymentSessionId: {
      type: String
    }
  },
  paymentGateway: {
    type: String,
    enum: ['razorpay', 'cashfree'],
    default: 'razorpay'
  }
}, {
  timestamps: true
});

// Generate order number and tracking number before saving
orderSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Generate order number
    if (!this.orderNumber) {
      this.orderNumber = 'VB' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase();
    }
    
    // Generate tracking number
    if (!this.trackingNumber) {
      this.trackingNumber = 'TRK' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();
    }
    
    // Initialize tracking history with dynamic payment description
    if (!this.trackingHistory || this.trackingHistory.length === 0) {
      // Determine payment description based on payment method and status
      let paymentDescription = 'Order confirmed';
      if (this.paymentMethod === 'cod') {
        paymentDescription = 'Order confirmed. Payment will be collected on delivery';
      } else if (this.paymentMethod === 'online' || this.paymentMethod === 'card' || this.paymentMethod === 'upi') {
        if (this.paymentStatus === 'completed') {
          paymentDescription = 'Order confirmed and payment received';
        } else if (this.paymentStatus === 'pending') {
          paymentDescription = 'Order confirmed. Payment pending';
        } else if (this.paymentStatus === 'failed') {
          paymentDescription = 'Order confirmed. Payment failed';
        } else {
          paymentDescription = 'Order confirmed and payment received';
        }
      }
      
      this.trackingHistory = [
        {
          status: 'Order Placed',
          date: new Date(),
          description: 'Your order has been placed successfully',
          completed: true
        },
        {
          status: 'Confirmed',
          date: new Date(),
          description: paymentDescription,
          completed: true
        },
        {
          status: 'Processing',
          date: null,
          description: 'Your order is being processed',
          completed: false
        },
        {
          status: 'Shipped',
          date: null,
          description: 'Your order has been shipped',
          completed: false
        },
        {
          status: 'Out for Delivery',
          date: null,
          description: 'Your order is out for delivery',
          completed: false
        },
        {
          status: 'Delivered',
          date: null,
          description: 'Your order has been delivered',
          completed: false
        }
      ];
    }
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);

