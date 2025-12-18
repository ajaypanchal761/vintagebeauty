const Admin = require('../model/Admin');
const generateToken = require('../utils/generateToken');
const bcrypt = require('bcryptjs');


// @desc    Register new admin
// @route   POST /api/admin/register
// @access  Public
exports.registerAdmin = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Check if admin already exists with this email
    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin already exists with this email'
      });
    }

    // Create admin (only in admins model, not users model)
    const admin = await Admin.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password
    });

    // Don't generate token on registration - user must login separately
    res.status(201).json({
      success: true,
      message: 'Admin registered successfully. Please login with your credentials.',
      data: {
        admin: {
          _id: admin._id,
          name: admin.name,
          email: admin.email,
          isActive: admin.isActive
        }
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }
    next(error);
  }
};

// @desc    Login admin with email and password
// @route   POST /api/admin/login
// @access  Public
exports.loginAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find admin by email and include password
    const admin = await Admin.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your admin account has been deactivated'
      });
    }

    // Verify password
    if (!admin.password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate admin token using admin._id (not user._id)
    const adminToken = generateToken(admin._id);

    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      data: {
        admin: {
          _id: admin._id,
          name: admin.name,
          email: admin.email,
          isActive: admin.isActive,
          lastLogin: admin.lastLogin
        },
        adminToken
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all admins (Admin only)
// @route   GET /api/admin
// @access  Private/Admin
exports.getAdmins = async (req, res, next) => {
  try {
    const admins = await Admin.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: admins.length,
      data: admins
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single admin (Admin only)
// @route   GET /api/admin/:id
// @access  Private/Admin
exports.getAdmin = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.status(200).json({
      success: true,
      data: admin
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current admin profile
// @route   GET /api/admin/me
// @access  Private/Admin
exports.getMe = async (req, res, next) => {
  try {
    const admin = req.admin;

    res.status(200).json({
      success: true,
      data: {
        _id: admin._id,
        name: admin.name,
        username: admin.name, // Map name to username for frontend compatibility
        email: admin.email,
        isActive: admin.isActive,
        lastLogin: admin.lastLogin,
        role: 'admin',
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update admin profile
// @route   PUT /api/admin/me
// @access  Private/Admin
exports.updateAdminProfile = async (req, res, next) => {
  try {
    const { username, name, email, currentPassword, newPassword } = req.body;
    const admin = req.admin;

    // Get admin with password for verification
    const adminWithPassword = await Admin.findById(admin._id).select('+password');

    // Verify current password if password change is requested or if updating profile
    if (currentPassword) {
      const isMatch = await adminWithPassword.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }
    } else if (newPassword) {
      // If new password is provided but current password is not, require it
      return res.status(400).json({
        success: false,
        message: 'Current password is required to change password'
      });
    }

    // Prepare update fields
    const updateFields = {};

    // Update name/username
    if (username !== undefined && username.trim()) {
      updateFields.name = username.trim();
    } else if (name !== undefined && name.trim()) {
      updateFields.name = name.trim();
    }

    // Update email
    if (email !== undefined && email.trim()) {
      // Check if email is already taken by another admin
      const existingAdmin = await Admin.findOne({ 
        email: email.toLowerCase().trim(),
        _id: { $ne: admin._id }
      });
      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
      updateFields.email = email.toLowerCase().trim();
    }

    // Update password if new password is provided
    if (newPassword && newPassword.trim()) {
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters long'
        });
      }
      // Hash the password before saving (since findByIdAndUpdate doesn't trigger pre-save hook)
      const salt = await bcrypt.genSalt(10);
      updateFields.password = await bcrypt.hash(newPassword.trim(), salt);
    }

    // Update admin
    const updatedAdmin = await Admin.findByIdAndUpdate(
      admin._id,
      updateFields,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      message: 'Admin profile updated successfully',
      data: {
        _id: updatedAdmin._id,
        name: updatedAdmin.name,
        username: updatedAdmin.name, // Map name to username for frontend compatibility
        email: updatedAdmin.email,
        isActive: updatedAdmin.isActive,
        lastLogin: updatedAdmin.lastLogin,
        role: 'admin'
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }
    next(error);
  }
};

