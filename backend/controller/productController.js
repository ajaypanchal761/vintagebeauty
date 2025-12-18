const Product = require('../model/Product');
const Category = require('../model/Category');
const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res, next) => {
  try {
    const {
      category,
      search,
      minPrice,
      maxPrice,
      isFeatured,
      isBestSeller,
      isMostLoved,
      inStock,
      gender,
      sort,
      page = 1,
      limit = 20
    } = req.query;

    // Build query
    const query = {};

    // Handle category filtering: Find category by slug/name and use ObjectId
    if (category) {
      try {
        const categorySlug = category.toLowerCase();
        
        // First, try to find category by slug (most common case)
        let categoryDoc = await Category.findOne({ 
          slug: categorySlug,
          isActive: true 
        });
        
        // If not found by slug, try to match by name (fallback for old data or direct name matching)
        if (!categoryDoc) {
          // Convert slug to name format: 'room-spray' -> 'Room Spray'
          const categoryName = category
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          categoryDoc = await Category.findOne({ 
            name: { $regex: new RegExp(`^${categoryName}$`, 'i') },
            isActive: true 
          });
        }
        
        if (categoryDoc) {
          // Use category ObjectId for filtering (works for ALL products - old and new)
          query.category = categoryDoc._id;
        } else {
          // Fallback: Try to match by categoryName field in Product model
          // Convert slug to name format: 'room-spray' -> 'Room Spray'
          const categoryName = category
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          query.categoryName = { $regex: new RegExp(`^${categoryName}$`, 'i') };
        }
      } catch (err) {
        console.error('❌ Error finding category:', err);
        // On error, don't filter by category (return all products)
        // This prevents the API from breaking if there's a database issue
      }
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brandName: { $regex: search, $options: 'i' } }
      ];
    }

    if (minPrice || maxPrice) {
      query.$or = [
        { price: {} },
        { 'sizes.price': {} }
      ];
      if (minPrice) {
        query.$or[0].price = { $gte: Number(minPrice) };
        query.$or[1]['sizes.price'] = { $gte: Number(minPrice) };
      }
      if (maxPrice) {
        query.$or[0].price = { ...query.$or[0].price, $lte: Number(maxPrice) };
        query.$or[1]['sizes.price'] = { ...query.$or[1]['sizes.price'], $lte: Number(maxPrice) };
      }
    }

    if (isFeatured !== undefined) {
      query.isFeatured = isFeatured === 'true';
    }

    if (isBestSeller !== undefined) {
      query.isBestSeller = isBestSeller === 'true';
    }

    if (isMostLoved !== undefined) {
      query.isMostLoved = isMostLoved === 'true';
    }

    if (inStock !== undefined) {
      query.inStock = inStock === 'true';
    }

    if (gender) {
      query.gender = gender;
    }

    // Sort
    let sortBy = {};
    if (sort) {
      switch (sort) {
        case 'price-low':
          sortBy = { price: 1 };
          break;
        case 'price-high':
          sortBy = { price: -1 };
          break;
        case 'rating':
          sortBy = { rating: -1 };
          break;
        case 'newest':
          sortBy = { createdAt: -1 };
          break;
        default:
          sortBy = { createdAt: -1 };
      }
    } else {
      sortBy = { createdAt: -1 };
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort(sortBy)
      .skip(skip)
      .limit(Number(limit));

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get product by slug
// @route   GET /api/products/slug/:slug
// @access  Public
exports.getProductBySlug = async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug })
      .populate('category', 'name slug');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get featured products
// @route   GET /api/products/featured
// @access  Public
exports.getFeaturedProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ isFeatured: true })
      .populate('category', 'name slug')
      .limit(10);

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get bestseller products
// @route   GET /api/products/bestsellers
// @access  Public
exports.getBestsellerProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ isBestSeller: true })
      .populate('category', 'name slug')
      .limit(10);

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get most loved products
// @route   GET /api/products/most-loved
// @access  Public
exports.getMostLovedProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ isMostLoved: true })
      .populate('category', 'name slug')
      .limit(10);

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get products by category
// @route   GET /api/products/category/:categorySlug
// @access  Public
exports.getProductsByCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({ slug: req.params.categorySlug });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const products = await Product.find({ category: category._id })
      .populate('category', 'name slug');

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create product (Admin)
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = async (req, res, next) => {
  try {
    const productData = req.body;
    const imageUrls = [];

    // Handle images if uploaded - upload to Cloudinary
    // req.files is an object with field names as keys when using fields()
    if (req.files) {
      try {
        const allFiles = [];
        
        // Collect all uploaded files from different fields
        if (req.files.mainImage) allFiles.push(...req.files.mainImage);
        if (req.files.image1) allFiles.push(...req.files.image1);
        if (req.files.image2) allFiles.push(...req.files.image2);
        if (req.files.image3) allFiles.push(...req.files.image3);
        if (req.files.images) allFiles.push(...req.files.images); // Fallback for array upload
        
        // Upload all images to Cloudinary directly from buffer (modern e-commerce approach)
        for (const file of allFiles) {
          const uploadResult = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                folder: 'apm-beauty-products',
                resource_type: 'image',
                transformation: [
                  { quality: 'auto' },
                  { fetch_format: 'auto' }
                ]
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            );
            
            // Convert buffer to stream and pipe to Cloudinary
            const bufferStream = new Readable();
            bufferStream.push(file.buffer);
            bufferStream.push(null);
            bufferStream.pipe(uploadStream);
          });
          
          imageUrls.push(uploadResult.secure_url);
        }
        
        if (imageUrls.length > 0) {
          productData.images = imageUrls;
        }
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload images to Cloudinary',
          error: uploadError.message
        });
      }
    }

    // Ensure category is properly set (it should be ObjectId)
    if (productData.category) {
      // Get category name if not provided (required for slug generation)
      if (!productData.categoryName && productData.category) {
        try {
          const category = await Category.findById(productData.category);
          if (category) {
            productData.categoryName = category.name;
          }
        } catch (err) {
          console.error('Error fetching category name:', err);
        }
      }
    }

    // Convert string fields to proper types
    if (productData.price) productData.price = parseFloat(productData.price);
    if (productData.regularPrice) productData.regularPrice = parseFloat(productData.regularPrice);
    if (productData.stock !== undefined) productData.stock = parseInt(productData.stock);
    if (productData.inStock !== undefined) productData.inStock = productData.inStock === 'true' || productData.inStock === true;
    if (productData.isBestSeller !== undefined) productData.isBestSeller = productData.isBestSeller === 'true' || productData.isBestSeller === true;
    if (productData.isFeatured !== undefined) productData.isFeatured = productData.isFeatured === 'true' || productData.isFeatured === true;
    if (productData.isMostLoved !== undefined) productData.isMostLoved = productData.isMostLoved === 'true' || productData.isMostLoved === true;
    if (productData.codAvailable !== undefined) productData.codAvailable = productData.codAvailable === 'true' || productData.codAvailable === true;

    const product = await Product.create(productData);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product (Admin)
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Handle images if uploaded - upload to Cloudinary
    // req.files is an object with field names as keys when using fields()
    if (req.files) {
      try {
        const imageUrls = [];
        const allFiles = [];
        
        // Collect all uploaded files from different fields
        if (req.files.mainImage) allFiles.push(...req.files.mainImage);
        if (req.files.image1) allFiles.push(...req.files.image1);
        if (req.files.image2) allFiles.push(...req.files.image2);
        if (req.files.image3) allFiles.push(...req.files.image3);
        if (req.files.images) allFiles.push(...req.files.images); // Fallback for array upload
        
        // Upload all new images to Cloudinary directly from buffer (modern e-commerce approach)
        for (const file of allFiles) {
          const uploadResult = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                folder: 'apm-beauty-products',
                resource_type: 'image',
                transformation: [
                  { quality: 'auto' },
                  { fetch_format: 'auto' }
                ]
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            );
            
            // Convert buffer to stream and pipe to Cloudinary
            const bufferStream = new Readable();
            bufferStream.push(file.buffer);
            bufferStream.push(null);
            bufferStream.pipe(uploadStream);
          });
          
          imageUrls.push(uploadResult.secure_url);
        }
        
        // If new images uploaded, replace existing images
        // Otherwise keep existing images
        if (imageUrls.length > 0) {
          req.body.images = imageUrls;
        }
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload images to Cloudinary',
          error: uploadError.message
        });
      }
    }

    // Ensure category is properly set (it should be ObjectId)
    if (req.body.category) {
      // Get category name if not provided (required for slug generation)
      if (!req.body.categoryName && req.body.category) {
        try {
          const category = await Category.findById(req.body.category);
          if (category) {
            req.body.categoryName = category.name;
          }
        } catch (err) {
          console.error('Error fetching category name:', err);
        }
      }
    }

    // Regenerate slug if name or category changed (to allow same name in different categories)
    if (req.body.name || req.body.categoryName) {
      const productName = req.body.name || product.name;
      const categoryName = req.body.categoryName || product.categoryName;
      
      const nameSlug = productName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      if (categoryName) {
        const categorySlug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        req.body.slug = `${nameSlug}-${categorySlug}`;
      } else {
        req.body.slug = nameSlug;
      }
    }

    // Convert string fields to proper types
    if (req.body.price) req.body.price = parseFloat(req.body.price);
    if (req.body.regularPrice) req.body.regularPrice = parseFloat(req.body.regularPrice);
    if (req.body.stock !== undefined) req.body.stock = parseInt(req.body.stock);
    if (req.body.inStock !== undefined) req.body.inStock = req.body.inStock === 'true' || req.body.inStock === true;
    if (req.body.isBestSeller !== undefined) req.body.isBestSeller = req.body.isBestSeller === 'true' || req.body.isBestSeller === true;
    if (req.body.isFeatured !== undefined) req.body.isFeatured = req.body.isFeatured === 'true' || req.body.isFeatured === true;
    if (req.body.isMostLoved !== undefined) req.body.isMostLoved = req.body.isMostLoved === 'true' || req.body.isMostLoved === true;
    if (req.body.codAvailable !== undefined) req.body.codAvailable = req.body.codAvailable === 'true' || req.body.codAvailable === true;

    product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('category', 'name slug');

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product (Admin)
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

