const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const { authenticateUser } = require('../middleware/auth');

router.use(authenticateUser);

router.get('/', wishlistController.getWishlist);
router.post('/:productId', wishlistController.toggleWishlist);

module.exports = router;
