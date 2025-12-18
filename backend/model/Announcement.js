const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Please provide content'],
    trim: true
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'success', 'error', 'promotion'],
    default: 'info'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'draft'
  },
  displayLocation: [{
    type: String,
    enum: ['home', 'shop', 'checkout', 'account', 'all']
  }],
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  link: {
    url: {
      type: String,
      trim: true
    },
    text: {
      type: String,
      trim: true,
      default: 'Learn More'
    }
  },
  backgroundColor: {
    type: String,
    default: '#3b82f6'
  },
  textColor: {
    type: String,
    default: '#ffffff'
  },
  isDismissible: {
    type: Boolean,
    default: true
  },
  showOnMobile: {
    type: Boolean,
    default: true
  },
  showOnDesktop: {
    type: Boolean,
    default: true
  },
  views: {
    type: Number,
    default: 0
  },
  clicks: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Announcement', announcementSchema);


