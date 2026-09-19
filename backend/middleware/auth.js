const admin = require('../firebaseAdmin');
const { getUserByUid, getAllowedAdmins } = require('../services/userStore');

function getAllowedAdminEmails() {
  return getAllowedAdmins();
}

exports.authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;

    let profile = await getUserByUid(decodedToken.uid);
    if (!profile) {
      profile = await require('../services/userStore').createOrUpdateUserProfile({
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name || ''
      });
    }

    req.profile = profile;
    req.isAdmin =
      profile.role === 'admin' ||
      getAllowedAdminEmails().includes(decodedToken.email?.toLowerCase() || '');
    next();
  } catch (err) {
    console.error('Authentication failed:', err);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

exports.requireAdmin = (req, res, next) => {
  if (!req.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

exports.requireRole = (...roles) => (req, res, next) => {
  const role = req.profile?.role;
  if (!role || !roles.includes(role)) {
    if (roles.includes('admin') && req.isAdmin) return next();
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};

exports.requireCounselorOrAdmin = (req, res, next) => {
  const role = req.profile?.role;
  if (role === 'counselor' || role === 'admin' || req.isAdmin) return next();
  return res.status(403).json({ error: 'Counselor access required' });
};
