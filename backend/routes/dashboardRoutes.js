const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getSalesAnalytics,
  getStockSummary,
  getRevenueAnalytics
} = require('../controller/dashboardController');
const { protectAdmin } = require('../middleware/adminAuth');

// All dashboard routes require admin authentication
router.get('/stats', protectAdmin, getDashboardStats);
router.get('/sales-analytics', protectAdmin, getSalesAnalytics);
router.get('/stock-summary', protectAdmin, getStockSummary);
router.get('/revenue-analytics', protectAdmin, getRevenueAnalytics);

module.exports = router;

