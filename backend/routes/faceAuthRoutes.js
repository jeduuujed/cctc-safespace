const express = require('express');
const { getFaceStatus, enroll, verify, remove } = require('../controllers/faceAuthController');
const { authenticateUser } = require('../middleware/auth');
const { rateLimit } = require('../middleware/rateLimit');

const router = express.Router();

router.get('/status', authenticateUser, getFaceStatus);
router.post('/enroll', authenticateUser, rateLimit({ max: 10, keyPrefix: 'face-enroll' }), enroll);
router.post('/verify', rateLimit({ max: 20, keyPrefix: 'face-verify' }), verify);
router.delete('/enroll', authenticateUser, remove);

module.exports = router;
