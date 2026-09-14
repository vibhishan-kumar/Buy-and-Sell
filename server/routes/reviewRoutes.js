const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticateUser } = require('../middleware/auth');

router.get('/seller/:sellerId', reviewController.getSellerReviews);
router.post('/', authenticateUser, reviewController.createReview);

module.exports = router;
