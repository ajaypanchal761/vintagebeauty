const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createServer } = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const User = require('./model/User');
const Order = require('./model/Order');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Initialize express app
const app = express();

// Create HTTP server
const httpServer = createServer(app);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware - Production CORS for Vercel frontend
app.use(cors({
  origin: [
    "https://vintagebeauty-luqb.vercel.app",
    "https://vintagebeauty.vercel.app",
    // Allow localhost for development
    ...(process.env.NODE_ENV !== 'production' ? [
      'http://localhost:5173',
      'http://localhost:5174'
    ] : [])
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true
}));

// Initialize Socket.IO with same CORS configuration
const io = new Server(httpServer, {
  cors: {
    origin: [
      "https://vintagebeauty-luqb.vercel.app",
      "https://vintagebeauty.vercel.app",
      // Allow localhost for development
      ...(process.env.NODE_ENV !== 'production' ? [
        'http://localhost:5173',
        'http://localhost:5174'
      ] : [])
    ],
    credentials: true,
    methods: ['GET', 'POST']
  }
});

// Socket.IO authentication middleware
io.use(async (socket, next) => {
  try {
    // Get token from handshake auth or query
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    
    if (!token) {
      // Allow connection without token (for public features like announcements/coupons)
      // But user-specific features won't work
      socket.userId = null;
      return next();
    }

    // Verify JWT token
    const decoded = jwt.verify(token.trim(), process.env.JWT_SECRET);
    
    if (!decoded || !decoded.id) {
      socket.userId = null;
      return next();
    }

    // Verify user exists and is active
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      socket.userId = null;
      return next();
    }

    // Store user ID in socket
    socket.userId = user._id.toString();
    next();
  } catch (error) {
    // If token is invalid, allow connection but without user ID
    socket.userId = null;
    next();
  }
});

// Socket.IO connection handling
io.on('connection', async (socket) => {

  // If user is authenticated, auto-join them to their order rooms
  if (socket.userId) {
    try {
      // Find all orders for this user
      const userOrders = await Order.find({ user: socket.userId }).select('_id');
      
      // Join user to their order rooms
      userOrders.forEach(order => {
        const orderRoom = `order-${order._id}`;
        socket.join(orderRoom);
      });

      // Also join user to their personal notification room
      const userRoom = `user-${socket.userId}`;
      socket.join(userRoom);
    } catch (error) {
      console.error('Error auto-joining user to order rooms:', error);
    }
  }

  // Manual join order room (with ownership verification)
  socket.on('join-order-room', async (orderId) => {
    if (!socket.userId) {
      // Don't emit error for unauthenticated users, just silently fail
      return;
    }

    try {
      // Verify user owns this order
      const order = await Order.findById(orderId);
      if (!order) {
        // Order doesn't exist yet - this is normal during order creation
        return;
      }

      if (order.user.toString() !== socket.userId) {
        // User doesn't own this order
        return;
      }

      socket.join(`order-${orderId}`);
    } catch (error) {
      // Log error but don't emit to client to avoid UI errors
      console.error('Error joining order room:', error);
    }
  });

  // Leave order room
  socket.on('leave-order-room', (orderId) => {
    socket.leave(`order-${orderId}`);
  });

  socket.on('disconnect', () => {
    // Client disconnected
  });
});

// Make io available to other modules
app.set('io', io);

// Routes
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'APM Beauty and Perfume API is running',
    version: '1.0.0'
  });
});

// Health check route for testing and monitoring
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    message: 'Server is running properly',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Detailed health check with database connection status
app.get('/health/detailed', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const dbStatus = mongoose.connection.readyState;
    const dbStates = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    const healthData = {
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      database: {
        status: dbStates[dbStatus] || 'unknown',
        readyState: dbStatus,
        connected: dbStatus === 1
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB'
      }
    };

    // If database is not connected, return 503 (Service Unavailable)
    if (dbStatus !== 1) {
      healthData.status = 'unhealthy';
      healthData.message = 'Database connection issue';
      return res.status(503).json(healthData);
    }

    res.status(200).json(healthData);
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes')); // OTP auth routes
app.use('/api/users', require('./routes/userRoutes'));
// Settings route must come BEFORE /api/admin to avoid route conflict with /api/admin/:id
app.use('/api/admin/settings', require('./routes/settingsRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/wishlist', require('./routes/wishlistRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/coupons', require('./routes/couponRoutes'));
app.use('/api/blogs', require('./routes/blogRoutes'));
app.use('/api/hero-carousel', require('./routes/heroCarouselRoutes'));
app.use('/api/combo-deals', require('./routes/comboDealRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));
app.use('/api/policies', require('./routes/policyRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/refunds', require('./routes/refundRoutes'));
app.use('/api/support', require('./routes/supportRoutes'));
app.use('/api/user-analytics', require('./routes/userAnalyticsRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));

// Error handler middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
const PORT = process.env.PORT || 5001;

httpServer.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`Socket.IO server initialized`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Error: ${err.message}`);
  // Close server & exit process
  httpServer.close(() => process.exit(1));
});

module.exports = { app, io };

