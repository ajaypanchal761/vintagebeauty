const Review = require('../model/Review');
const Product = require('../model/Product');

// Helper function to update product rating
const updateProductRating = async (productId) => {
  try {
    // Get all approved reviews for this product
    const reviews = await Review.find({
      product: productId,
      isApproved: true
    });

    if (reviews.length === 0) {
      // No reviews, set rating to 0
      await Product.findByIdAndUpdate(productId, {
        rating: 0,
        reviews: 0
      });
      return;
    }

    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    // Round to 1 decimal place
    const roundedRating = Math.round(averageRating * 10) / 10;

    // Update product with new rating and review count
    await Product.findByIdAndUpdate(productId, {
      rating: roundedRating,
      reviews: reviews.length
    });
  } catch (error) {
    console.error('Error updating product rating:', error);
    throw error;
  }
};

// @desc    Create a new review
// @route   POST /api/reviews
// @access  Private
exports.createReview = async (req, res, next) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!productId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Product ID and rating are required'
      });
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if user has already reviewed this product
    const existingReview = await Review.findOne({
      product: productId,
      user: userId
    });

    if (existingReview) {
      // Update existing review
      existingReview.rating = rating;
      if (comment) {
        existingReview.comment = comment;
      }
      existingReview.isApproved = true; // Auto-approve updated reviews
      await existingReview.save();

      // Update product rating
      await updateProductRating(productId);

      // Populate user info
      await existingReview.populate('user', 'name email');

      return res.status(200).json({
        success: true,
        message: 'Review updated successfully',
        data: existingReview
      });
    }

    // Get user info
    const userName = req.user.name || 'Anonymous';
    const userEmail = req.user.email || '';

    // Create new review
    const review = await Review.create({
      product: productId,
      user: userId,
      rating,
      comment: comment || '',
      userName,
      userEmail,
      isApproved: true // Auto-approve reviews
    });

    // Update product rating
    await updateProductRating(productId);

    // Populate user info
    await review.populate('user', 'name email');

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: review
    });
  } catch (error) {
    console.error('Create review error:', error);

    // Handle duplicate key error (just in case)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product'
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message).join(', ');
      return res.status(400).json({
        success: false,
        message: `Validation error: ${messages}`
      });
    }

    next(error);
  }
};

// @desc    Get reviews for a product
// @route   GET /api/reviews/product/:productId
// @access  Public
exports.getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Get approved reviews with pagination
    const skip = (Number(page) - 1) * Number(limit);

    const reviews = await Review.find({
      product: productId,
      isApproved: true
    })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await Review.countDocuments({
      product: productId,
      isApproved: true
    });

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: reviews
    });
  } catch (error) {
    console.error('Get product reviews error:', error);
    next(error);
  }
};

// @desc    Get user's review for a product
// @route   GET /api/reviews/product/:productId/user
// @access  Private
exports.getUserReview = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;

    const review = await Review.findOne({
      product: productId,
      user: userId
    })
      .populate('user', 'name email')
      .lean();

    if (!review) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No review found'
      });
    }

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    console.error('Get user review error:', error);
    next(error);
  }
};

// @desc    Update a review
// @route   PUT /api/reviews/:id
// @access  Private
exports.updateReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id;

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user owns this review
    if (review.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this review'
      });
    }

    // Update review
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5'
        });
      }
      review.rating = rating;
    }

    if (comment !== undefined) {
      review.comment = comment;
    }

    await review.save();

    // Update product rating
    await updateProductRating(review.product);

    // Populate user info
    await review.populate('user', 'name email');

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      data: review
    });
  } catch (error) {
    console.error('Update review error:', error);
    next(error);
  }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private
exports.deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user owns this review or is admin
    if (review.user.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review'
      });
    }

    const productId = review.product;

    // Delete review
    await Review.findByIdAndDelete(id);

    // Update product rating
    await updateProductRating(productId);

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    next(error);
  }
};


