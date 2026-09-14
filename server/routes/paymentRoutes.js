const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateUser } = require('../middleware/auth');

router.use(authenticateUser);

router.post('/create-order', paymentController.createOrder);
router.post('/verify', paymentController.verifyPayment);
router.get('/orders', paymentController.getUserOrders);
router.get('/orders/:id', paymentController.getOrderById);

module.exports = router;
