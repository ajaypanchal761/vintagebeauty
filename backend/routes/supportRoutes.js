const express = require('express');
const router = express.Router();
const {
  getQueries,
  getTickets,
  getSupportItem,
  createQuery,
  createTicket,
  addQueryResponse,
  addTicketMessage,
  updateStatus,
  updateSupportItem,
  deleteSupportItem,
  getStats,
  getMySupport
} = require('../controller/supportController');
const { protectAdmin } = require('../middleware/adminAuth');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/queries', createQuery);
router.post('/tickets', createTicket);

// User routes - using protect middleware
// IMPORTANT: /my must come before /:id to avoid route conflicts
router.get('/my', protect, getMySupport);

// Admin routes - using protectAdmin middleware
router.get('/stats', protectAdmin, getStats);
router.get('/queries', protectAdmin, getQueries);
router.get('/tickets', protectAdmin, getTickets);
// This route must come after /my to avoid conflicts
router.get('/:id', protectAdmin, getSupportItem);
router.post('/queries/:id/response', protectAdmin, addQueryResponse);
router.post('/tickets/:id/message', protectAdmin, addTicketMessage);
router.patch('/:id/status', protectAdmin, updateStatus);
router.put('/:id', protectAdmin, updateSupportItem);
router.delete('/:id', protectAdmin, deleteSupportItem);

module.exports = router;

