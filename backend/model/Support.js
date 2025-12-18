const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
    trim: true
  },
  sender: {
    type: String,
    enum: ['user', 'admin'],
    required: true
  },
  senderName: {
    type: String,
    trim: true
  },
  senderEmail: {
    type: String,
    trim: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const supportQuerySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['query', 'ticket'],
    required: true,
    default: 'query'
  },
  subject: {
    type: String,
    required: function() {
      return this.type === 'query';
    },
    trim: true
  },
  title: {
    type: String,
    required: function() {
      return this.type === 'ticket';
    },
    trim: true
  },
  message: {
    type: String,
    required: function() {
      return this.type === 'query';
    },
    trim: true
  },
  description: {
    type: String,
    required: function() {
      return this.type === 'ticket';
    },
    trim: true
  },
  customerName: {
    type: String,
    trim: true
  },
  userName: {
    type: String,
    trim: true
  },
  customerEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  customerPhone: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['new', 'open', 'in_progress', 'resolved', 'closed'],
    default: 'new'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['general', 'technical', 'billing', 'order', 'product', 'other'],
    default: 'general'
  },
  responses: [responseSchema],
  messages: [responseSchema] // For tickets
}, {
  timestamps: true
});

// Index for better query performance
supportQuerySchema.index({ status: 1, type: 1 });
supportQuerySchema.index({ userId: 1 });
supportQuerySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Support', supportQuerySchema);


