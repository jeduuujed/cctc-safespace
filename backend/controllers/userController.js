const {
  createOrUpdateUserProfile,
  getUserByUid,
  listAllUsers,
  listUsersByRole,
  updateUserProfile
} = require('../services/userStore');

exports.registerProfile = async (req, res) => {
  try {
    const { name, studentId } = req.body;
    const profile = await createOrUpdateUserProfile({
      uid: req.user.uid,
      email: req.user.email,
      name: name || req.user.name || '',
      studentId
    });
    res.json({ profile });
  } catch (err) {
    console.error('registerProfile error:', err);
    res.status(500).json({ error: 'Failed to create profile' });
  }
};

exports.getMyProfile = async (req, res) => {
  try {
    const profile = req.profile || (await getUserByUid(req.user.uid));
    res.json({ profile });
  } catch (err) {
    console.error('getMyProfile error:', err);
    res.status(500).json({ error: 'Failed to load profile' });
  }
};

exports.updateMyProfile = async (req, res) => {
  try {
    const { name } = req.body;
    const profile = await updateUserProfile(req.user.uid, { name }, req.profile.role);
    res.json({ profile });
  } catch (err) {
    console.error('updateMyProfile error:', err);
    res.status(err.message === 'Forbidden profile update' ? 403 : 500).json({ error: err.message || 'Failed to update profile' });
  }
};

exports.listUsers = async (req, res) => {
  try {
    const users = await listAllUsers();
    res.json({ users });
  } catch (err) {
    console.error('listUsers error:', err);
    res.status(500).json({ error: 'Failed to list users' });
  }
};

exports.listAssignedStudents = async (req, res) => {
  try {
    const students = await listUsersByRole('student');
    const assigned = students.filter((student) => student.assignedCounselorId === req.user.uid);
    res.json({ students: assigned });
  } catch (err) {
    console.error('listAssignedStudents error:', err);
    res.status(500).json({ error: 'Failed to load assigned students' });
  }
};

exports.adminUpdateUser = async (req, res) => {
  try {
    const { uid } = req.params;
    const { role, name, studentId, assignedCounselorId, authorizedTeacherIds, faceLoginEnabled } = req.body;

    if (uid === req.user.uid && role && role !== req.profile.role) {
      return res.status(403).json({ error: 'You cannot change your own role' });
    }

    const profile = await updateUserProfile(
      uid,
      { role, name, studentId, assignedCounselorId, authorizedTeacherIds, faceLoginEnabled },
      'admin'
    );
    res.json({ profile });
  } catch (err) {
    console.error('adminUpdateUser error:', err);
    res.status(err.message === 'User not found' ? 404 : 500).json({ error: err.message || 'Failed to update user' });
  }
};
