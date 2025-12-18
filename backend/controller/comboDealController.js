const ComboDeal = require('../model/ComboDeal');
const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');

// @desc    Get all combo deals
// @route   GET /api/combo-deals
// @access  Public
exports.getComboDeals = async (req, res, next) => {
  try {
    const deals = await ComboDeal.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: deals.length,
      data: deals
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all combo deals (Admin)
// @route   GET /api/combo-deals/admin/all
// @access  Private/Admin
exports.getAllComboDeals = async (req, res, next) => {
  try {
    const deals = await ComboDeal.find()
      .sort({ order: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: deals.length,
      data: deals
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single combo deal
// @route   GET /api/combo-deals/:id
// @access  Public
exports.getComboDeal = async (req, res, next) => {
  try {
    const deal = await ComboDeal.findById(req.params.id);

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: `Combo deal not found with id of ${req.params.id}`
      });
    }

    res.status(200).json({
      success: true,
      data: deal
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create combo deal
// @route   POST /api/combo-deals
// @access  Private/Admin
exports.createComboDeal = async (req, res, next) => {
  try {
    const dealData = { ...req.body };

    // Handle image upload if file is provided
    if (req.files && req.files.image && req.files.image.length > 0) {
      try {
        const file = req.files.image[0];
        
        const uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'apm-beauty-combo-deals',
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
          
          const bufferStream = new Readable();
          bufferStream.push(file.buffer);
          bufferStream.push(null);
          bufferStream.pipe(uploadStream);
        });
        
        dealData.image = uploadResult.secure_url;
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
      dealData.image = req.body.image;
    }

    // Parse numeric fields
    dealData.currentPrice = parseFloat(dealData.currentPrice);
    dealData.originalPrice = parseFloat(dealData.originalPrice);
    dealData.dealPrice = parseFloat(dealData.dealPrice);
    dealData.requiredItems = parseInt(dealData.requiredItems);
    dealData.freeItems = parseInt(dealData.freeItems) || 0;
    dealData.isActive = dealData.isActive === 'true' || dealData.isActive === true;
    
    // Set order if not provided
    if (!dealData.order && dealData.order !== 0) {
      const count = await ComboDeal.countDocuments();
      dealData.order = count;
    } else {
      dealData.order = parseInt(dealData.order) || 0;
    }

    const deal = await ComboDeal.create(dealData);

    res.status(201).json({
      success: true,
      message: 'Combo deal created successfully',
      data: deal
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update combo deal
// @route   PUT /api/combo-deals/:id
// @access  Private/Admin
exports.updateComboDeal = async (req, res, next) => {
  try {
    let deal = await ComboDeal.findById(req.params.id);

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: `Combo deal not found with id of ${req.params.id}`
      });
    }

    const updateData = { ...req.body };

    // Handle image upload if file is provided
    if (req.files && req.files.image && req.files.image.length > 0) {
      try {
        const file = req.files.image[0];
        
        const uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'apm-beauty-combo-deals',
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
          
          const bufferStream = new Readable();
          bufferStream.push(file.buffer);
          bufferStream.push(null);
          bufferStream.pipe(uploadStream);
        });
        
        updateData.image = uploadResult.secure_url;
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
      updateData.image = req.body.image;
    }

    // Parse numeric fields
    if (updateData.currentPrice !== undefined) {
      updateData.currentPrice = parseFloat(updateData.currentPrice);
    }
    if (updateData.originalPrice !== undefined) {
      updateData.originalPrice = parseFloat(updateData.originalPrice);
    }
    if (updateData.dealPrice !== undefined) {
      updateData.dealPrice = parseFloat(updateData.dealPrice);
    }
    if (updateData.requiredItems !== undefined) {
      updateData.requiredItems = parseInt(updateData.requiredItems);
    }
    if (updateData.freeItems !== undefined) {
      updateData.freeItems = parseInt(updateData.freeItems);
    }
    if (updateData.isActive !== undefined) {
      updateData.isActive = updateData.isActive === 'true' || updateData.isActive === true;
    }
    if (updateData.order !== undefined) {
      updateData.order = parseInt(updateData.order);
    }

    deal = await ComboDeal.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Combo deal updated successfully',
      data: deal
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete combo deal
// @route   DELETE /api/combo-deals/:id
// @access  Private/Admin
exports.deleteComboDeal = async (req, res, next) => {
  try {
    const deal = await ComboDeal.findById(req.params.id);

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: `Combo deal not found with id of ${req.params.id}`
      });
    }

    await deal.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle combo deal active status
// @route   PUT /api/combo-deals/:id/toggle
// @access  Private/Admin
exports.toggleComboDeal = async (req, res, next) => {
  try {
    const deal = await ComboDeal.findById(req.params.id);

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: `Combo deal not found with id of ${req.params.id}`
      });
    }

    deal.isActive = !deal.isActive;
    await deal.save();

    res.status(200).json({
      success: true,
      data: deal
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update combo deal order
// @route   PUT /api/combo-deals/order/update
// @access  Private/Admin
exports.updateComboDealOrder = async (req, res, next) => {
  try {
    const { deals } = req.body;

    if (!Array.isArray(deals)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of deals with order'
      });
    }

    const updatePromises = deals.map((deal, index) =>
      ComboDeal.findByIdAndUpdate(deal._id || deal.id, { order: index + 1 }, { new: true })
    );

    await Promise.all(updatePromises);

    const updatedDeals = await ComboDeal.find().sort({ order: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      data: updatedDeals
    });
  } catch (error) {
    next(error);
  }
};

