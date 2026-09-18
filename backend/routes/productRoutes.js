const express = require('express');
const router = express.Router();
const { createProduct, getProducts } = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(getProducts)
  .post(protect, authorize('SELLER', 'ADMIN'), createProduct);

module.exports = router;
