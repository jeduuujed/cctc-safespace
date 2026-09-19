const express = require('express');
const {
  registerProfile,
  getMyProfile,
  updateMyProfile,
  listUsers,
  listAssignedStudents,
  adminUpdateUser
} = require('../controllers/userController');
const { authenticateUser, requireAdmin, requireRole } = require('../middleware/auth');
const { rateLimit } = require('../middleware/rateLimit');

const router = express.Router();

router.post('/register', authenticateUser, rateLimit({ max: 10, keyPrefix: 'reg' }), registerProfile);
router.get('/me', authenticateUser, getMyProfile);
router.put('/me', authenticateUser, updateMyProfile);
router.get('/assigned-students', authenticateUser, requireRole('counselor', 'admin'), listAssignedStudents);
router.get('/', authenticateUser, requireAdmin, listUsers);
router.put('/:uid', authenticateUser, requireAdmin, adminUpdateUser);

module.exports = router;
