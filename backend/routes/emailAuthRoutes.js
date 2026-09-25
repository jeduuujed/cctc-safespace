const express = require('express');
const { requestCode, verifyCode } = require('../controllers/emailAuthController');
const { rateLimit } = require('../middleware/rateLimit');

const router = express.Router();

router.post('/request-code', rateLimit({ max: 5, keyPrefix: 'email-code-request' }), requestCode);
router.post('/verify-code', rateLimit({ max: 10, keyPrefix: 'email-code-verify' }), verifyCode);

module.exports = router;