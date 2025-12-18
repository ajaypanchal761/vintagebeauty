const HeroCarousel = require('../model/HeroCarousel');
const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');

// @desc    Get all hero carousel items
// @route   GET /api/hero-carousel
// @access  Public (for frontend display) / Private/Admin (for management)
exports.getCarouselItems = async (req, res, next) => {
  try {
    const { active } = req.query;
    
    let query = {};
    if (active === 'true') {
      query.isActive = true;
    }

    const items = await HeroCarousel.find(query)
      .sort({ order: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single hero carousel item
// @route   GET /api/hero-carousel/:id
// @access  Private/Admin
exports.getCarouselItem = async (req, res, next) => {
  try {
    const item = await HeroCarousel.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Hero carousel item not found'
      });
    }

    res.status(200).json({
      success: true,
      data: item
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new hero carousel item
// @route   POST /api/hero-carousel
// @access  Private/Admin
exports.createCarouselItem = async (req, res, next) => {
  try {
    const carouselData = req.body;

    // Handle image upload if file is provided
    if (req.files && req.files.image && req.files.image.length > 0) {
      try {
        const file = req.files.image[0];
        
        const uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'apm-beauty-hero-carousel',
              resource_type: 'auto', // Auto-detect image or video
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
          
          const bufferStream = new Readable();
          bufferStream.push(file.buffer);
          bufferStream.push(null);
          bufferStream.pipe(uploadStream);
        });
        
        carouselData.image = uploadResult.secure_url;
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload image to Cloudinary',
          error: uploadError.message || 'Unknown upload error'
        });
      }
    } else if (req.body.image && typeof req.body.image === 'string') {
      // If no file but image URL is provided, use the URL directly
      carouselData.image = req.body.image;
    }

    // Set order if not provided
    if (!carouselData.order && carouselData.order !== 0) {
      const count = await HeroCarousel.countDocuments();
      carouselData.order = count;
    }

    const carouselItem = await HeroCarousel.create(carouselData);

    res.status(201).json({
      success: true,
      message: 'Hero carousel item created successfully',
      data: carouselItem
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update hero carousel item
// @route   PUT /api/hero-carousel/:id
// @access  Private/Admin
exports.updateCarouselItem = async (req, res, next) => {
  try {
    const carouselData = { ...req.body };

    // Handle image upload if file is provided
    if (req.files && req.files.image && req.files.image.length > 0) {
      try {
        const file = req.files.image[0];
        
        const uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'apm-beauty-hero-carousel',
              resource_type: 'auto',
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
          
          const bufferStream = new Readable();
          bufferStream.push(file.buffer);
          bufferStream.push(null);
          bufferStream.pipe(uploadStream);
        });
        
        carouselData.image = uploadResult.secure_url;
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload image to Cloudinary',
          error: uploadError.message || 'Unknown upload error'
        });
      }
    } else if (req.body.image && typeof req.body.image === 'string') {
      // If no file but image URL is provided, use the URL directly
      carouselData.image = req.body.image;
    }

    const carouselItem = await HeroCarousel.findByIdAndUpdate(
      req.params.id,
      carouselData,
      {
        new: true,
        runValidators: true
      }
    );

    if (!carouselItem) {
      return res.status(404).json({
        success: false,
        message: 'Hero carousel item not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Hero carousel item updated successfully',
      data: carouselItem
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete hero carousel item
// @route   DELETE /api/hero-carousel/:id
// @access  Private/Admin
exports.deleteCarouselItem = async (req, res, next) => {
  try {
    const carouselItem = await HeroCarousel.findById(req.params.id);

    if (!carouselItem) {
      return res.status(404).json({
        success: false,
        message: 'Hero carousel item not found'
      });
    }

    await HeroCarousel.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Hero carousel item deleted successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle active status of hero carousel item
// @route   PUT /api/hero-carousel/:id/toggle-active
// @access  Private/Admin
exports.toggleCarouselActive = async (req, res, next) => {
  try {
    const carouselItem = await HeroCarousel.findById(req.params.id);

    if (!carouselItem) {
      return res.status(404).json({
        success: false,
        message: 'Hero carousel item not found'
      });
    }

    carouselItem.isActive = !carouselItem.isActive;
    await carouselItem.save();

    res.status(200).json({
      success: true,
      message: `Hero carousel item ${carouselItem.isActive ? 'activated' : 'deactivated'} successfully`,
      data: carouselItem
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update carousel order
// @route   PUT /api/hero-carousel/update-order
// @access  Private/Admin
exports.updateCarouselOrder = async (req, res, next) => {
  try {
    const { items } = req.body; // Array of items with _id and order

    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'Items must be an array'
      });
    }

    // Update order for each item
    const updatePromises = items.map((item, index) => 
      HeroCarousel.findByIdAndUpdate(
        item._id,
        { order: index },
        { new: true }
      )
    );

    await Promise.all(updatePromises);

    const updatedItems = await HeroCarousel.find()
      .sort({ order: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Carousel order updated successfully',
      data: updatedItems
    });
  } catch (error) {
    next(error);
  }
};

