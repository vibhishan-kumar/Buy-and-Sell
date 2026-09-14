const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateUser, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public browse routes (optional auth enables checking if products are in the user's wishlist)
router.get('/', optionalAuth, productController.getProducts);
router.get('/my-listings', authenticateUser, productController.getMyListings);
router.get('/:id', optionalAuth, productController.getProductById);

// Authenticated seller routes
router.post('/', authenticateUser, upload.array('images', 5), productController.createProduct);
router.put('/:id', authenticateUser, upload.array('images', 5), productController.updateProduct);
router.delete('/:id', authenticateUser, productController.deleteProduct);
router.patch('/:id/status', authenticateUser, productController.markAsSold);

module.exports = router;
