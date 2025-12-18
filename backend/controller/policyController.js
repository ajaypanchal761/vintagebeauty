const Policy = require('../model/Policy');

// @desc    Get all policies (Admin)
// @route   GET /api/policies
// @access  Private/Admin
exports.getPolicies = async (req, res, next) => {
  try {
    const policies = await Policy.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: policies.length,
      data: policies
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get policy by type (Public)
// @route   GET /api/policies/type/:type
// @access  Public
exports.getPolicyByType = async (req, res, next) => {
  try {
    const { type } = req.params;
    
    
    // Validate policy type
    const validTypes = ['privacy', 'terms', 'refund', 'about'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid policy type. Must be one of: ${validTypes.join(', ')}`
      });
    }
    
    const policy = await Policy.findOne({ type });

    if (!policy) {
      // Return 200 with success: false instead of 404
      // This allows frontend to handle "policy doesn't exist" gracefully
      return res.status(200).json({
        success: false,
        message: 'Policy not found',
        data: null
      });
    }

    res.status(200).json({
      success: true,
      data: policy
    });
  } catch (error) {
    console.error('Error in getPolicyByType:', error);
    next(error);
  }
};

// @desc    Get single policy (Admin)
// @route   GET /api/policies/:id
// @access  Private/Admin
exports.getPolicy = async (req, res, next) => {
  try {
    const policy = await Policy.findById(req.params.id);

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Policy not found'
      });
    }

    res.status(200).json({
      success: true,
      data: policy
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create or update policy (Admin)
// @route   POST /api/policies
// @access  Private/Admin
exports.createOrUpdatePolicy = async (req, res, next) => {
  try {
    const { type, heading, content } = req.body;

    if (!type || !heading || !content) {
      return res.status(400).json({
        success: false,
        message: 'Please provide type, heading, and content'
      });
    }

    // Check if policy with this type already exists
    const existingPolicy = await Policy.findOne({ type });

    let policy;
    if (existingPolicy) {
      // Update existing policy
      policy = await Policy.findByIdAndUpdate(
        existingPolicy._id,
        { heading, content },
        {
          new: true,
          runValidators: true
        }
      );
      
      res.status(200).json({
        success: true,
        message: 'Policy updated successfully',
        data: policy
      });
    } else {
      // Create new policy
      policy = await Policy.create({ type, heading, content });
      
      res.status(201).json({
        success: true,
        message: 'Policy created successfully',
        data: policy
      });
    }
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Policy type already exists'
      });
    }
    next(error);
  }
};

// @desc    Update policy (Admin)
// @route   PUT /api/policies/:id
// @access  Private/Admin
exports.updatePolicy = async (req, res, next) => {
  try {
    const policy = await Policy.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Policy not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Policy updated successfully',
      data: policy
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete policy (Admin)
// @route   DELETE /api/policies/:id
// @access  Private/Admin
exports.deletePolicy = async (req, res, next) => {
  try {
    const policy = await Policy.findById(req.params.id);

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Policy not found'
      });
    }

    await policy.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Policy deleted successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

