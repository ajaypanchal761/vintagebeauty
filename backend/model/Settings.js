const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: [true, 'Setting key is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  value: {
    type: String,
    required: [true, 'Setting value is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  type: {
    type: String,
    enum: ['string', 'number', 'boolean', 'json'],
    default: 'string'
  }
}, {
  timestamps: true
});

// Note: Index on 'key' is automatically created by 'unique: true' above
// No need to manually define it again

module.exports = mongoose.model('Settings', settingsSchema);

