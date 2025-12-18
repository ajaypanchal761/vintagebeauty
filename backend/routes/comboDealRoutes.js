const express = require('express');
const router = express.Router();
const {
  getComboDeals,
  getAllComboDeals,
  getComboDeal,
  createComboDeal,
  updateComboDeal,
  deleteComboDeal,
  toggleComboDeal,
  updateComboDealOrder
} = require('../controller/comboDealController');
const { protectAdmin } = require('../middleware/adminAuth');
const upload = require('../middleware/upload');

// Public routes
router.get('/', getComboDeals);
router.get('/:id', getComboDeal);

// Admin routes
router.get('/admin/all', protectAdmin, getAllComboDeals);
router.post('/', protectAdmin, upload.fields([{ name: 'image', maxCount: 1 }]), createComboDeal);
router.put('/:id', protectAdmin, upload.fields([{ name: 'image', maxCount: 1 }]), updateComboDeal);
router.delete('/:id', protectAdmin, deleteComboDeal);
router.put('/:id/toggle', protectAdmin, toggleComboDeal);
router.put('/order/update', protectAdmin, updateComboDealOrder);

module.exports = router;

