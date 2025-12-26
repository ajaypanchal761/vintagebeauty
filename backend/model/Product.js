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
  material: {
    type: String,
    trim: true
  },
  colour: {
    type: String,
    trim: true
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
  utility: {
    type: String,
    trim: true
  },
  care: {
    type: String,
    trim: true
  },
  // Gift Set fields
  isGiftSet: {
    type: Boolean,
    default: false
  },
  giftSetItems: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1
    },
    selectedSize: {
      type: String,
      default: null
    }
  }],
  giftSetDiscount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  giftSetTotalPrice: {
    type: Number,
    default: 0
  },
  giftSetDiscountedPrice: {
    type: Number,
    default: 0
  },
  giftSetManualPrice: {
    type: Number,
    min: 0
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  }
}, {
  timestamps: true
});

// Generate slug before saving - includes category to allow same name in different categories
productSchema.pre('save', function (next) {
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
productSchema.pre('save', function (next) {
  this.inStock = this.stock > 0;
  next();
});

// Auto-set isGiftSet based on giftSetItems presence
productSchema.pre('save', function (next) {
  // Automatically set isGiftSet if giftSetItems exist and isGiftSet is not explicitly set
  if (this.giftSetItems && this.giftSetItems.length > 0 && this.isGiftSet !== false) {
    this.isGiftSet = true;
  }
  next();
});

// Calculate gift set prices
productSchema.pre('save', async function (next) {
  if (this.isGiftSet && this.giftSetItems && this.giftSetItems.length > 0) {
    try {
      let totalPrice = 0;

      // Calculate total price from gift set items
      for (const item of this.giftSetItems) {
        if (item.product) {
          const product = await mongoose.model('Product').findById(item.product);
          if (product) {
            let itemPrice = 0;

            // Get price based on selected size or default price
            if (item.selectedSize && product.sizes && product.sizes.length > 0) {
              const sizeObj = product.sizes.find(s => s.size === item.selectedSize);
              if (sizeObj) {
                itemPrice = sizeObj.price;
              }
            } else if (product.price) {
              itemPrice = product.price;
            }

            totalPrice += itemPrice * item.quantity;
          }
        }
      }

      this.giftSetTotalPrice = totalPrice;
      this.giftSetDiscountedPrice = totalPrice * (1 - this.giftSetDiscount / 100);

      // Use manual price if set, otherwise use calculated discounted price
      const finalPrice = this.giftSetManualPrice || this.giftSetDiscountedPrice;

      // Set the main price to the final price for gift sets
      this.price = finalPrice;
      this.regularPrice = this.giftSetTotalPrice;
    } catch (error) {
      console.error('Error calculating gift set prices:', error);
    }
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);

