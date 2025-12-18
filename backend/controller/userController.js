const User = require('../model/User');
const generateToken = require('../utils/generateToken');
const bcrypt = require('bcryptjs');
const { sendOTPSMS } = require('../services/smsService');

// Generate 6-digit OTP
const generateOTP = () => {
  // Generate random 6-digit OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Hash OTP before storing
const hashOTP = async (otp) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(otp, salt);
};

// Verify OTP
const verifyOTPHash = async (otp, hashedOTP) => {
  return await bcrypt.compare(otp, hashedOTP);
};

// @desc    Send OTP to phone number
// @route   POST /api/users/send-otp or POST /api/auth/send-otp
// @access  Public
exports.sendOTP = async (req, res, next) => {
  try {
    const { phone, phoneNumber, isLogin } = req.body;
    
    // Support both 'phone' and 'phoneNumber' for compatibility
    const phoneNum = phone || phoneNumber;

    if (!phoneNum || phoneNum.length !== 10) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit phone number'
      });
    }

    // Find user
    let user = await User.findOne({ phone: phoneNum }).select('+otp +otpExpiry');

    // If it's a login request and user doesn't exist, return error
    if (isLogin && !user) {
      return res.status(404).json({
        success: false,
        message: 'Phone number is not registered. Please sign up first.'
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

    // Hash OTP before storing
    const hashedOTP = await hashOTP(otp);

    if (user) {
      // User exists - update OTP
      user.otp = hashedOTP;
      user.otpExpiry = otpExpiry;
      await user.save();
    } else {
      // Create new user (for signup flow)
      user = await User.create({
        phone: phoneNum,
        name: `User${phoneNum}`, // Temporary name
        otp: hashedOTP,
        otpExpiry
      });
    }

    // Send OTP via SMSINDIAHUB
    try {
      await sendOTPSMS(phoneNum, otp);
    } catch (smsError) {
      console.error('Failed to send SMS:', smsError.message);
      // Still save OTP in database, but return error to user
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP SMS. Please try again later.',
        error: process.env.NODE_ENV === 'development' ? smsError.message : undefined
      });
    }

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully to your phone number'
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    next(error);
  }
};

// @desc    Verify OTP and login/signup
// @route   POST /api/users/verify-otp or POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = async (req, res, next) => {
  try {
    const { phone, phoneNumber, otp, name, email } = req.body;
    
    // Support both 'phone' and 'phoneNumber' for compatibility
    const phoneNum = phone || phoneNumber;

    if (!phoneNum || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide phone number and OTP'
      });
    }

    if (otp.length !== 6) {
      return res.status(400).json({
        success: false,
        message: 'OTP must be 6 digits'
      });
    }

    const user = await User.findOne({ phone: phoneNum }).select('+otp +otpExpiry');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found. Please request OTP first'
      });
    }

    // Check if OTP exists
    if (!user.otp) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found. Please request a new OTP'
      });
    }

    // Check if OTP is expired
    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new OTP'
      });
    }

    // Verify OTP (compare hashed)
    const isOTPValid = await verifyOTPHash(otp, user.otp);
    
    if (!isOTPValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please check and try again'
      });
    }

    // Update user info if provided (for signup)
    if (name && name.trim()) {
      user.name = name.trim();
    }
    if (email && email.trim()) {
      user.email = email.trim();
    }

    // For first user, set as admin (or check if admin exists)
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount === 0 && !user.role) {
      user.role = 'admin'; // Set first user as admin
    }

    // Clear OTP
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    next(error);
  }
};

// @desc    Register a new user (with email and password)
// @route   POST /api/users/register or POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your name'
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your email'
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Validate phone number if provided
    if (phone && phone.trim()) {
      const phoneNum = phone.replace(/\D/g, '');
      if (phoneNum.length !== 10) {
        return res.status(400).json({
          success: false,
          message: 'Phone number must be exactly 10 digits'
        });
      }
    }

    // Check if user already exists by email
    const userExists = await User.findOne({ email: email.toLowerCase().trim() });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Check if phone number is already taken (if provided)
    if (phone && phone.trim()) {
      const phoneNum = phone.replace(/\D/g, '');
      const phoneExists = await User.findOne({ phone: phoneNum });
      if (phoneExists) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this phone number'
        });
      }
    }

    // Create user
    const userData = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password
    };

    // Add phone if provided
    if (phone && phone.trim()) {
      userData.phone = phone.replace(/\D/g, '');
    }

    const user = await User.create(userData);

    // For first user, set as admin
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount === 0 && !user.role) {
      user.role = 'admin';
      await user.save();
    }

    // Generate token
    const token = generateToken(user._id);

    // Remove password from response
    user.password = undefined;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user (with email and password)
// @route   POST /api/users/login or POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your email'
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your password'
      });
    }

    // Find user by email and include password field
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user has a password set
    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Generate token
    const token = generateToken(user._id);
    
    // Remove password from response
    user.password = undefined;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/users/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    // req.user should be set by protect middleware
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Find user by ID (exclude sensitive fields)
    const user = await User.findById(req.user._id).select('-password -otp -otpExpiry');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('getMe error:', error);
    next(error);
  }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password');

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
exports.updateUser = async (req, res, next) => {
  try {
    const { name, email, phone, isActive } = req.body;

    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (email !== undefined) updateFields.email = email;
    if (phone !== undefined) updateFields.phone = phone;
    if (isActive !== undefined) updateFields.isActive = isActive;

    // Check if admin is updating (from adminAuth middleware) or user is updating themselves
    const isAdmin = req.admin || (req.user && req.user.role === 'admin');
    const isSelfUpdate = req.user && req.user._id.toString() === req.params.id;

    // If admin route, allow all updates. If regular route, check authorization
    if (!req.admin) {
      if (!isAdmin && !isSelfUpdate) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this user'
        });
      }

      // Regular users cannot update isActive
      if (isActive !== undefined && !isAdmin) {
        delete updateFields.isActive;
      }
    }
    // Admin (from protectAdmin) can update everything including isActive

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateFields,
      {
        new: true,
        runValidators: true
      }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add address to user
// @route   POST /api/users/:id/addresses
// @access  Private
exports.addAddress = async (req, res, next) => {
  try {
    const { type, name, phone, address, city, state, pincode, isDefault } = req.body;

    if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add address for this user'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (isDefault) {
      user.addresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    user.addresses.push({
      type,
      name,
      phone,
      address,
      city,
      state,
      pincode,
      isDefault: isDefault || false
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update address
// @route   PUT /api/users/:id/addresses/:addressId
// @access  Private
exports.updateAddress = async (req, res, next) => {
  try {
    const { type, name, phone, address, city, state, pincode, isDefault } = req.body;

    if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update address for this user'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const addressIndex = user.addresses.findIndex(
      addr => addr._id.toString() === req.params.addressId
    );

    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    if (isDefault) {
      user.addresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    if (type) user.addresses[addressIndex].type = type;
    if (name) user.addresses[addressIndex].name = name;
    if (phone) user.addresses[addressIndex].phone = phone;
    if (address) user.addresses[addressIndex].address = address;
    if (city) user.addresses[addressIndex].city = city;
    if (state) user.addresses[addressIndex].state = state;
    if (pincode) user.addresses[addressIndex].pincode = pincode;
    if (isDefault !== undefined) user.addresses[addressIndex].isDefault = isDefault;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete address
// @route   DELETE /api/users/:id/addresses/:addressId
// @access  Private
exports.deleteAddress = async (req, res, next) => {
  try {
    if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete address for this user'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.addresses = user.addresses.filter(
      addr => addr._id.toString() !== req.params.addressId
    );

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Set default address
// @route   PUT /api/users/:id/addresses/:addressId/set-default
// @access  Private
exports.setDefaultAddress = async (req, res, next) => {
  try {
    if (req.user._id.toString() !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.addresses.forEach(addr => {
      addr.isDefault = addr._id.toString() === req.params.addressId;
    });

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Default address updated successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset user password (Admin only)
// @route   PUT /api/users/:id/reset-password
// @access  Private/Admin
exports.resetUserPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    const user = await User.findById(req.params.id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

