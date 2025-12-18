const express = require('express');
const router = express.Router();
const {
  getCarouselItems,
  getCarouselItem,
  createCarouselItem,
  updateCarouselItem,
  deleteCarouselItem,
  toggleCarouselActive,
  updateCarouselOrder
} = require('../controller/heroCarouselController');
const { protectAdmin } = require('../middleware/adminAuth');
const upload = require('../middleware/upload');

// Public route - get active carousel items for frontend display
router.get('/', getCarouselItems);

// Admin routes - require authentication
router.get('/:id', protectAdmin, getCarouselItem);
router.post('/', protectAdmin, upload.fields([{ name: 'image', maxCount: 1 }]), createCarouselItem);
router.put('/:id', protectAdmin, upload.fields([{ name: 'image', maxCount: 1 }]), updateCarouselItem);
router.delete('/:id', protectAdmin, deleteCarouselItem);
router.put('/:id/toggle-active', protectAdmin, toggleCarouselActive);
router.put('/update-order', protectAdmin, updateCarouselOrder);

module.exports = router;

