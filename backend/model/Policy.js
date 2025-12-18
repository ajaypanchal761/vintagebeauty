const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, 'Please provide policy type'],
    enum: ['terms', 'refund', 'privacy', 'about'],
    unique: true
  },
  heading: {
    type: String,
    required: [true, 'Please provide policy heading'],
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Please provide policy content'],
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Policy', policySchema);

