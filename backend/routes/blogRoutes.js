const express = require('express');
const router = express.Router();
const {
  getBlogs,
  getPublishedBlogs,
  getBlog,
  getBlogBySlug,
  createBlog,
  updateBlog,
  deleteBlog,
  toggleBlogStatus,
  getBlogStats
} = require('../controller/blogController');
const { protectAdmin } = require('../middleware/adminAuth');
const upload = require('../middleware/upload');

// Public routes
router.get('/published', getPublishedBlogs);
router.get('/slug/:slug', getBlogBySlug);

// Admin routes
router.get('/stats', protectAdmin, getBlogStats);
router.get('/', protectAdmin, getBlogs);
router.get('/:id', protectAdmin, getBlog);
router.post('/', protectAdmin, upload.fields([{ name: 'featuredImage', maxCount: 1 }]), createBlog);
router.put('/:id', protectAdmin, upload.fields([{ name: 'featuredImage', maxCount: 1 }]), updateBlog);
router.patch('/:id/toggle-status', protectAdmin, toggleBlogStatus);
router.delete('/:id', protectAdmin, deleteBlog);

module.exports = router;

