const express = require('express');
const {
  getContacts,
  listConversations,
  createConversation,
  postMessage,
  getConversationMessages,
  markRead
} = require('../controllers/messagingController');
const { authenticateUser } = require('../middleware/auth');
const { rateLimit } = require('../middleware/rateLimit');

const router = express.Router();

router.use(authenticateUser);
router.use(rateLimit({ max: 120, keyPrefix: 'msg' }));

router.get('/contacts', getContacts);
router.get('/conversations', listConversations);
router.post('/conversations', createConversation);
router.post('/messages', postMessage);
router.get('/conversations/:conversationId/messages', getConversationMessages);
router.post('/conversations/:conversationId/read', markRead);

module.exports = router;
