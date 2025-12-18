const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  size: {
    type: String
  },
  selectedPrice: {
    type: Number,
    required: true
  },
  comboDeal: {
    dealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ComboDeal'
    },
    dealPrice: {
      type: Number
    },
    requiredItems: {
      type: Number
    }
  }
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  coupon: {
    code: String,
    discount: Number,
    type: {
      type: String,
      enum: ['percentage', 'fixed']
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Cart', cartSchema);

