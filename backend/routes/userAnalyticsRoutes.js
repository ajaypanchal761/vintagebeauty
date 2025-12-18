const express = require('express');
const router = express.Router();
const {
  getUserAnalytics,
  getUserDetails,
  trackActivity
} = require('../controller/userAnalyticsController');
const { protectAdmin } = require('../middleware/adminAuth');

// Public route - for tracking activities
router.post('/track', trackActivity);

// Admin routes - protected with protectAdmin
router.get('/', protectAdmin, getUserAnalytics);
router.get('/users/:type', protectAdmin, getUserDetails);

module.exports = router;

