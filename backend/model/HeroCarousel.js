const mongoose = require('mongoose');

const heroCarouselSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true
  },
  subtitle: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  image: {
    type: String,
    required: [true, 'Please provide an image URL']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isMobile: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  },
  link: {
    type: String,
    trim: true
  },
  buttonText: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Auto-increment order if not provided
heroCarouselSchema.pre('save', async function(next) {
  if (this.isNew && this.order === 0) {
    const count = await mongoose.model('HeroCarousel').countDocuments();
    this.order = count;
  }
  next();
});

module.exports = mongoose.model('HeroCarousel', heroCarouselSchema);

