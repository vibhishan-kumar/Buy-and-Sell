const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateUser, authorizeRole } = require('../middleware/auth');

// Strict Admin-only middleware pipeline: Authenticate JWT -> Ensure role is 'admin'
router.use(authenticateUser);
router.use(authorizeRole('admin'));

// Statistics & Activity
router.get('/stats', adminController.getPlatformStats);
router.get('/logs', adminController.getAdminLogs);

// User Management
router.get('/users', adminController.getUsers);
router.patch('/users/:id/ban', adminController.banUser);
router.patch('/users/:id/unban', adminController.unbanUser);
router.delete('/users/:id', adminController.deleteUser);

// Product Governance
router.get('/products', adminController.getAllProducts);
router.patch('/products/:id/delist', adminController.delistProduct);
router.patch('/products/:id/relist', adminController.relistProduct);

// Category Management
router.post('/categories', adminController.addCategory);
router.put('/categories/:id', adminController.editCategory);
router.delete('/categories/:id', adminController.deleteCategory);

// Orders & Transactions
router.get('/orders', adminController.getAllOrders);

module.exports = router;
