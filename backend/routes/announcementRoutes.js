const express = require('express');
const router = express.Router();
const {
  getAnnouncements,
  getActiveAnnouncements,
  getAnnouncement,
  getAnnouncementStats,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  toggleAnnouncementStatus,
  incrementViews,
  incrementClicks
} = require('../controller/announcementController');
const { protectAdmin } = require('../middleware/adminAuth');

// Public routes
router.get('/active', getActiveAnnouncements);
router.patch('/:id/view', incrementViews);
router.patch('/:id/click', incrementClicks);

// Admin routes - using protectAdmin middleware
router.get('/stats', protectAdmin, getAnnouncementStats);
router.get('/', protectAdmin, getAnnouncements);
router.get('/:id', protectAdmin, getAnnouncement);
router.post('/', protectAdmin, createAnnouncement);
router.put('/:id', protectAdmin, updateAnnouncement);
router.delete('/:id', protectAdmin, deleteAnnouncement);
router.patch('/:id/toggle-status', protectAdmin, toggleAnnouncementStatus);

module.exports = router;

