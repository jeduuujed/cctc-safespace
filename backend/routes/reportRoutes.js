const express = require('express');
const {
  chatWithAI,
  submitReport,
  getReports,
  getMyReports,
  updateReportStatus
} = require('../controllers/reportController');
const { authenticateUser, requireAdmin, requireCounselorOrAdmin } = require('../middleware/auth');
const { rateLimit } = require('../middleware/rateLimit');

const router = express.Router();

router.post('/chat', rateLimit({ max: 60, keyPrefix: 'chat' }), chatWithAI);
router.post('/report', rateLimit({ max: 20, keyPrefix: 'report' }), submitReport);
router.get('/reports/mine', authenticateUser, getMyReports);
router.get('/reports', authenticateUser, requireCounselorOrAdmin, getReports);
router.put('/reports/:id', authenticateUser, requireAdmin, updateReportStatus);

module.exports = router;

