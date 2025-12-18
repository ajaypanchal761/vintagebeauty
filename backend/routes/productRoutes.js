const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProduct,
  getProductBySlug,
  getFeaturedProducts,
  getBestsellerProducts,
  getMostLovedProducts,
  getProductsByCategory,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controller/productController');
const { protectAdmin } = require('../middleware/adminAuth');
const upload = require('../middleware/upload');

// Public routes
router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/bestsellers', getBestsellerProducts);
router.get('/most-loved', getMostLovedProducts);
router.get('/category/:categorySlug', getProductsByCategory);
router.get('/slug/:slug', getProductBySlug);
router.get('/:id', getProduct);

// Admin routes - handle multiple image fields (mainImage, image1, image2, image3)
const uploadFields = upload.fields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'image1', maxCount: 1 },
  { name: 'image2', maxCount: 1 },
  { name: 'image3', maxCount: 1 }
]);

router.post('/', protectAdmin, uploadFields, createProduct);
router.put('/:id', protectAdmin, uploadFields, updateProduct);
router.delete('/:id', protectAdmin, deleteProduct);

module.exports = router;

