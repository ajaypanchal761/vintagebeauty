const mongoose = require('mongoose');

const comboDealSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title for the combo deal'],
    trim: true
  },
  dealHighlight: {
    type: String,
    required: [true, 'Please provide a deal highlight'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    trim: true
  },
  currentPrice: {
    type: Number,
    required: [true, 'Please provide the current price'],
    min: 0
  },
  originalPrice: {
    type: Number,
    required: [true, 'Please provide the original price'],
    min: 0
  },
  discount: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    required: [true, 'Please provide an image URL']
  },
  requiredItems: {
    type: Number,
    required: [true, 'Please specify the number of required items'],
    min: 1
  },
  freeItems: {
    type: Number,
    default: 0,
    min: 0
  },
  dealPrice: {
    type: Number,
    required: [true, 'Please provide the deal price'],
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for ordering
comboDealSchema.index({ order: 1, createdAt: -1 });

module.exports = mongoose.model('ComboDeal', comboDealSchema);

