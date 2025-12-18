const jwt = require('jsonwebtoken');
const User = require('../model/User');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  let token;

  // Extract token from Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Also check cookies if Authorization header is not present
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }


  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route - no token provided'
    });
  }

  // Trim token to remove any whitespace
  token = token.trim();

  // Validate token format (basic check)
  if (token.length < 10) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token format'
    });
  }

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded || !decoded.id) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Auth middleware - Invalid token structure:', { decoded });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid token - missing user ID'
      });
    }


    // Find user by ID (from User model, not Admin model)
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Auth middleware - User not found in User model:', {
          userId: decoded.id,
          url: req.originalUrl || req.url
        });
      }
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!req.user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated'
      });
    }

    // Success - user is authenticated
    next();
  } catch (error) {
    // Log error for debugging (remove sensitive info in production)
    if (process.env.NODE_ENV === 'development') {
      console.error('JWT verification error:', {
        message: error.message,
        name: error.name,
        url: req.originalUrl || req.url,
        tokenLength: token.length,
        tokenPrefix: token.substring(0, 20) + '...'
      });
    }
    
    // Provide more specific error messages
    let errorMessage = 'Not authorized to access this route - invalid or expired token';
    if (error.name === 'TokenExpiredError') {
      errorMessage = 'Token has expired. Please login again.';
    } else if (error.name === 'JsonWebTokenError') {
      errorMessage = 'Invalid token. Please login again.';
    }
    
    return res.status(401).json({
      success: false,
      message: errorMessage
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }
    next();
  };
};

