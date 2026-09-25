const admin = require('../firebaseAdmin');

const USERS_COLLECTION = 'users';

function getDb() {
  return admin.firestore();
}

function getAllowedAdmins() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

function normalizeUserDoc(doc) {
  if (!doc.exists) return null;
  const data = doc.data();
  return {
    uid: doc.id,
    name: data.name || '',
    email: data.email || '',
    role: data.role || 'student',
    studentId: data.studentId || '',
    assignedCounselorId: data.assignedCounselorId || null,
    authorizedTeacherIds: Array.isArray(data.authorizedTeacherIds) ? data.authorizedTeacherIds : [],
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt || null,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || data.updatedAt || null
  };
}

async function getUserByUid(uid) {
  const doc = await getDb().collection(USERS_COLLECTION).doc(uid).get();
  return normalizeUserDoc(doc);
}

async function getUserByEmail(email) {
  if (!email) return null;
  const snap = await getDb()
    .collection(USERS_COLLECTION)
    .where('email', '==', email.toLowerCase())
    .limit(1)
    .get();
  if (snap.empty) return null;
  return normalizeUserDoc(snap.docs[0]);
}

async function createOrUpdateUserProfile({ uid, email, name, studentId }) {
  const ref = getDb().collection(USERS_COLLECTION).doc(uid);
  const existing = await ref.get();
  const now = admin.firestore.FieldValue.serverTimestamp();
  const normalizedEmail = (email || '').toLowerCase();

  let role = 'student';
  if (existing.exists) {
    role = existing.data().role || 'student';
  } else if (getAllowedAdmins().includes(normalizedEmail)) {
    role = 'admin';
  }

  const base = {
    uid,
    email: normalizedEmail,
    name: name || '',
    role,
    updatedAt: now
  };

  const normalizedStudentId = typeof studentId === 'string' ? studentId.trim().slice(0, 32) : '';

  if (!existing.exists) {
    await ref.set({
      ...base,
      studentId: normalizedStudentId,
      assignedCounselorId: null,
      authorizedTeacherIds: [],
      createdAt: now
    });
  } else {
    const update = {
      email: normalizedEmail,
      name: name || existing.data().name || '',
      updatedAt: now
    };
    if (normalizedStudentId && !existing.data().studentId) {
      update.studentId = normalizedStudentId;
    }
    await ref.update(update);
  }

  return getUserByUid(uid);
}

async function listUsersByRole(role) {
  const snap = await getDb().collection(USERS_COLLECTION).where('role', '==', role).get();
  return snap.docs.map((doc) => normalizeUserDoc(doc));
}

async function listAllUsers() {
  const snap = await getDb().collection(USERS_COLLECTION).get();
  return snap.docs.map((doc) => normalizeUserDoc(doc));
}

async function updateUserProfile(uid, updates, actorRole) {
  const ref = getDb().collection(USERS_COLLECTION).doc(uid);
  const existing = await ref.get();
  if (!existing.exists) {
    throw new Error('User not found');
  }

  const allowed = {};
  const data = existing.data();

  if (typeof updates.name === 'string') allowed.name = updates.name.trim().slice(0, 120);

  if (actorRole === 'admin') {
    if (['student', 'teacher', 'counselor', 'admin'].includes(updates.role)) {
      allowed.role = updates.role;
    }
    if (typeof updates.studentId === 'string') allowed.studentId = updates.studentId.trim().slice(0, 32);
    if (updates.assignedCounselorId === null || typeof updates.assignedCounselorId === 'string') {
      allowed.assignedCounselorId = updates.assignedCounselorId || null;
    }
    if (Array.isArray(updates.authorizedTeacherIds)) {
      allowed.authorizedTeacherIds = updates.authorizedTeacherIds.filter((id) => typeof id === 'string').slice(0, 50);
    }
  } else if (typeof updates.name === 'string') {
    // Non-admin users may only update their display name
  } else {
    throw new Error('Forbidden profile update');
  }

  allowed.updatedAt = admin.firestore.FieldValue.serverTimestamp();
  await ref.update(allowed);
  return getUserByUid(uid);
}

module.exports = {
  getUserByUid,
  getUserByEmail,
  createOrUpdateUserProfile,
  listUsersByRole,
  listAllUsers,
  updateUserProfile,
  getAllowedAdmins
};
