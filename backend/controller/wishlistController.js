const Wishlist = require('../model/Wishlist');
const Product = require('../model/Product');

// @desc    Get user wishlist
// @route   GET /api/wishlist
// @access  Private
exports.getWishlist = async (req, res, next) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id }).populate('products');

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, products: [] });
    }

    res.status(200).json({
      success: true,
      data: wishlist
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add to wishlist
// @route   POST /api/wishlist
// @access  Private
exports.addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    let wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, products: [] });
    }

    if (wishlist.products.includes(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Product already in wishlist'
      });
    }

    wishlist.products.push(productId);
    await wishlist.save();
    await wishlist.populate('products');

    res.status(200).json({
      success: true,
      message: 'Product added to wishlist',
      data: wishlist
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove from wishlist
// @route   DELETE /api/wishlist/:productId
// @access  Private
exports.removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    const wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found'
      });
    }

    // Check if product exists in wishlist
    const productExists = wishlist.products.some(
      product => product.toString() === productId
    );

    if (!productExists) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in wishlist'
      });
    }

    wishlist.products = wishlist.products.filter(
      product => product.toString() !== productId
    );

    await wishlist.save();
    await wishlist.populate('products');

    res.status(200).json({
      success: true,
      message: 'Product removed from wishlist',
      data: wishlist
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear wishlist
// @route   DELETE /api/wishlist
// @access  Private
exports.clearWishlist = async (req, res, next) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found'
      });
    }

    wishlist.products = [];
    await wishlist.save();

    res.status(200).json({
      success: true,
      message: 'Wishlist cleared',
      data: wishlist
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all wishlists (Admin)
// @route   GET /api/wishlist/admin/all
// @access  Private/Admin
exports.getAllWishlists = async (req, res, next) => {
  try {
    const wishlists = await Wishlist.find()
      .populate('user', 'name email phone')
      .populate('products');

    res.status(200).json({
      success: true,
      count: wishlists.length,
      data: wishlists
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get wishlist analytics (Admin)
// @route   GET /api/wishlist/admin/analytics
// @access  Private/Admin
exports.getWishlistAnalytics = async (req, res, next) => {
  try {
    const wishlists = await Wishlist.find()
      .populate('user', 'name email phone')
      .populate('products');

    const totalWishlists = wishlists.length;
    const activeWishlists = wishlists.filter(w => w.products && w.products.length > 0).length;
    const emptyWishlists = totalWishlists - activeWishlists;
    const totalProducts = wishlists.reduce((sum, w) => sum + (w.products?.length || 0), 0);
    const avgPerUser = totalWishlists > 0 ? Math.round(totalProducts / totalWishlists) : 0;

    // Calculate most wishlisted products
    const productCounts = {};
    wishlists.forEach(wishlist => {
      wishlist.products?.forEach(product => {
        const productId = product._id?.toString() || product.toString();
        productCounts[productId] = (productCounts[productId] || 0) + 1;
      });
    });

    const mostWishlisted = Object.entries(productCounts)
      .map(([productId, count]) => ({
        productId,
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Get product details for most wishlisted
    const productIds = mostWishlisted.map(item => item.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    const productsMap = {};
    products.forEach(p => {
      productsMap[p._id.toString()] = p;
    });

    const mostWishlistedWithDetails = mostWishlisted.map(item => ({
      product: productsMap[item.productId] || null,
      count: item.count
    })).filter(item => item.product !== null);

    const analytics = {
      totalWishlists,
      activeWishlists,
      emptyWishlists,
      totalProducts,
      avgPerUser,
      activePercentage: totalWishlists > 0 ? ((activeWishlists / totalWishlists) * 100).toFixed(1) : 0,
      mostWishlisted: mostWishlistedWithDetails
    };

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
};

