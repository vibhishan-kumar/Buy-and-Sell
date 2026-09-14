const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateUser } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { validateEmailMiddleware } = require('../middleware/validate');

router.post('/register', upload.single('profile_image'), validateEmailMiddleware, authController.register);
router.post('/login', validateEmailMiddleware, authController.login);
router.get('/me', authenticateUser, authController.getMe);
router.put('/profile', authenticateUser, upload.single('profile_image'), authController.updateProfile);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.put('/change-password', authenticateUser, authController.changePassword);

module.exports = router;
