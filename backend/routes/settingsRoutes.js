const express = require('express');
const router = express.Router();
const {
  getSettings,
  getSetting,
  createSetting,
  updateSetting,
  deleteSetting
} = require('../controller/settingsController');
const { protectAdmin } = require('../middleware/adminAuth');

// All routes require admin authentication
router.get('/', protectAdmin, getSettings);
router.get('/:key', protectAdmin, getSetting);
router.post('/', protectAdmin, createSetting);
router.put('/:key', protectAdmin, updateSetting);
router.delete('/:key', protectAdmin, deleteSetting);

module.exports = router;

