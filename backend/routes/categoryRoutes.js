const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategory,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../controller/categoryController');
const { protectAdmin } = require('../middleware/adminAuth');
const upload = require('../middleware/upload');

// Public routes
router.get('/', getCategories);
router.get('/slug/:slug', getCategoryBySlug);
router.get('/:id', getCategory);

// Admin routes - handle image upload
// Use fields() to match req.files.image in controller
const uploadImage = upload.fields([{ name: 'image', maxCount: 1 }]);

router.post('/', protectAdmin, uploadImage, createCategory);
router.put('/:id', protectAdmin, uploadImage, updateCategory);
router.delete('/:id', protectAdmin, deleteCategory);

module.exports = router;

