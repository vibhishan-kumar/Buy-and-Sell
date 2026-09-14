const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticateUser } = require('../middleware/auth');

router.use(authenticateUser);

router.get('/conversations', messageController.getConversations);
router.post('/start', messageController.startConversation);
router.get('/conversations/:id', messageController.getMessages);
router.post('/conversations/:id', messageController.sendMessage);

module.exports = router;
