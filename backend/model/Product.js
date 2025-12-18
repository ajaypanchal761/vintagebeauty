const mongoose = require('mongoose');

const sizeSchema = new mongoose.Schema({
  size: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  }
});

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a product name'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide a product description']
  },
  price: {
    type: Number,
    min: [0, 'Price cannot be negative']
  },
  regularPrice: {
    type: Number,
    min: [0, 'Regular price cannot be negative']
  },
  sizes: [sizeSchema],
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Please provide a category']
  },
  categoryName: {
    type: String,
    required: true
  },
  images: [{
    type: String,
    required: true
  }],
  stock: {
    type: Number,
    required: [true, 'Please provide stock quantity'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  inStock: {
    type: Boolean,
    default: true
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviews: {
    type: Number,
    default: 0
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isBestSeller: {
    type: Boolean,
    default: false
  },
  isMostLoved: {
    type: Boolean,
    default: false
  },
  brandName: {
    type: String,
    default: 'VINTAGE BEAUTY'
  },
  type: {
    type: String
  },
  gender: {
    type: String,
    enum: ['men', 'women', 'unisex']
  },
  topNotes: [{
    type: String
  }],
  heartNotes: [{
    type: String
  }],
  baseNotes: [{
    type: String
  }],
  scentProfile: {
    type: String
  },
  performance: {
    longevity: String,
    projection: String,
    note: String,
    warning: String,
    recommendation: String
  },
  tags: [{
    type: String
  }],
  slug: {
    type: String,
    unique: true,
    lowercase: true
  }
}, {
  timestamps: true
});

// Generate slug before saving - includes category to allow same name in different categories
productSchema.pre('save', function(next) {
  if (this.isModified('name') || this.isModified('categoryName') || this.isModified('category')) {
    // Generate base slug from product name
    const nameSlug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    // Include category name in slug if available (allows same product name in different categories)
    if (this.categoryName) {
      const categorySlug = this.categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      this.slug = `${nameSlug}-${categorySlug}`;
    } else {
      // Fallback to name-only slug if categoryName not available
      this.slug = nameSlug;
    }
  }
  next();
});

// Update inStock based on stock
productSchema.pre('save', function(next) {
  this.inStock = this.stock > 0;
  next();
});

module.exports = mongoose.model('Product', productSchema);

