const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a blog title'],
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  excerpt: {
    type: String,
    required: [true, 'Please provide an excerpt'],
    trim: true,
    maxlength: [300, 'Excerpt cannot exceed 300 characters']
  },
  content: {
    type: String,
    required: [true, 'Please provide blog content'],
    trim: true
  },
  featuredImage: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['News', 'Tutorial', 'Product Review', 'Tips & Tricks', 'Company News', 'Other'],
    default: 'Other'
  },
  tags: [{
    type: String,
    trim: true
  }],
  author: {
    type: String,
    default: 'Admin',
    trim: true
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  metaTitle: {
    type: String,
    trim: true
  },
  metaDescription: {
    type: String,
    trim: true
  },
  metaKeywords: [{
    type: String,
    trim: true
  }],
  views: {
    type: Number,
    default: 0
  },
  publishedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Generate slug from title before saving
blogSchema.pre('save', function(next) {
  if (this.isModified('title') || this.isNew) {
    if (!this.slug || this.slug === '') {
      this.slug = this.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
  }
  
  // Set publishedAt when status changes to published
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  next();
});

// Index for better query performance
blogSchema.index({ status: 1 });
blogSchema.index({ category: 1 });
// Note: slug already has an index from unique: true, so no need to create it again
blogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Blog', blogSchema);

