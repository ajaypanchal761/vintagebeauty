const Settings = require('../model/Settings');

// @desc    Get all settings
// @route   GET /api/admin/settings
// @access  Private/Admin
exports.getSettings = async (req, res, next) => {
  try {
    const settings = await Settings.find().sort({ key: 1 });

    res.status(200).json({
      success: true,
      count: settings.length,
      data: {
        settings
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single setting by key
// @route   GET /api/admin/settings/:key
// @access  Private/Admin
exports.getSetting = async (req, res, next) => {
  try {
    const setting = await Settings.findOne({ key: req.params.key.toLowerCase() });

    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found'
      });
    }

    res.status(200).json({
      success: true,
      data: setting
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create or update setting
// @route   PUT /api/admin/settings/:key
// @access  Private/Admin
exports.updateSetting = async (req, res, next) => {
  try {
    const { value, description, type } = req.body;
    const key = req.params.key.toLowerCase().trim();

    if (!value) {
      return res.status(400).json({
        success: false,
        message: 'Setting value is required'
      });
    }

    // Find or create setting
    const setting = await Settings.findOneAndUpdate(
      { key },
      {
        key,
        value: value.trim(),
        description: description || '',
        type: type || 'string',
        updatedAt: new Date()
      },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      message: 'Setting updated successfully',
      data: setting
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Setting key already exists'
      });
    }
    next(error);
  }
};

// @desc    Create new setting
// @route   POST /api/admin/settings
// @access  Private/Admin
exports.createSetting = async (req, res, next) => {
  try {
    const { key, value, description, type } = req.body;

    if (!key || !value) {
      return res.status(400).json({
        success: false,
        message: 'Setting key and value are required'
      });
    }

    const setting = await Settings.create({
      key: key.toLowerCase().trim(),
      value: value.trim(),
      description: description || '',
      type: type || 'string'
    });

    res.status(201).json({
      success: true,
      message: 'Setting created successfully',
      data: setting
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Setting key already exists'
      });
    }
    next(error);
  }
};

// @desc    Delete setting
// @route   DELETE /api/admin/settings/:key
// @access  Private/Admin
exports.deleteSetting = async (req, res, next) => {
  try {
    const setting = await Settings.findOneAndDelete({ key: req.params.key.toLowerCase() });

    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Setting deleted successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

