const mongoose = require('mongoose');

const userActivitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null for anonymous users
  },
  sessionId: {
    type: String,
    trim: true
  },
  activityType: {
    type: String,
    enum: ['product_view', 'category_visit', 'add_to_cart', 'search', 'page_view', 'checkout_start', 'checkout_complete'],
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  categoryName: {
    type: String,
    trim: true
  },
  productName: {
    type: String,
    trim: true
  },
  searchQuery: {
    type: String,
    trim: true
  },
  pageUrl: {
    type: String,
    trim: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for better query performance
userActivitySchema.index({ userId: 1, createdAt: -1 });
userActivitySchema.index({ sessionId: 1, createdAt: -1 });
userActivitySchema.index({ activityType: 1, createdAt: -1 });
userActivitySchema.index({ productId: 1, createdAt: -1 });
userActivitySchema.index({ categoryId: 1, createdAt: -1 });
userActivitySchema.index({ createdAt: -1 });

module.exports = mongoose.model('UserActivity', userActivitySchema);

