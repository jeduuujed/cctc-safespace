const admin = require('../firebaseAdmin');
const { getUserByUid, listUsersByRole } = require('./userStore');
const { evaluateConversationAccess } = require('./conversationPolicy');

const CONVERSATIONS = 'conversations';
const MAX_MESSAGE_LENGTH = 4000;

function getDb() {
  return admin.firestore();
}

function buildConversationId(type, participantIds) {
  const sorted = [...participantIds].sort();
  return `${type}_${sorted.join('_')}`;
}

function normalizeConversation(doc) {
  const data = doc.data();
  return {
    conversationId: doc.id,
    participants: data.participants || [],
    participantRoles: data.participantRoles || {},
    conversationType: data.conversationType || '',
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() || null,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() || null,
    lastMessage: data.lastMessage || '',
    lastMessageAt: data.lastMessageAt?.toDate?.()?.toISOString?.() || null,
    unreadCount: data.unreadCount || {}
  };
}

function normalizeMessage(doc) {
  const data = doc.data();
  return {
    messageId: doc.id,
    conversationId: data.conversationId,
    senderId: data.senderId,
    senderRole: data.senderRole || '',
    text: data.text || '',
    createdAt: data.createdAt?.toDate?.()?.toISOString?.() || null,
    readBy: Array.isArray(data.readBy) ? data.readBy : []
  };
}

async function canCreateConversation(creatorProfile, type, otherUserId) {
  const other = await getUserByUid(otherUserId);
  if (!other) return { ok: false, error: 'Contact not found' };
  return evaluateConversationAccess(creatorProfile, type, other);
}

async function getOrCreateConversation(profile, type, otherUserId) {
  const check = await canCreateConversation(profile, type, otherUserId);
  if (!check.ok) throw new Error(check.error);

  const conversationId = buildConversationId(type, check.participants);
  const ref = getDb().collection(CONVERSATIONS).doc(conversationId);
  const existing = await ref.get();

  if (existing.exists) {
    return normalizeConversation(existing);
  }

  const now = admin.firestore.FieldValue.serverTimestamp();
  const unreadCount = {};
  check.participants.forEach((pid) => {
    unreadCount[pid] = 0;
  });

  const doc = {
    participants: check.participants,
    participantRoles: check.roles,
    conversationType: type,
    createdAt: now,
    updatedAt: now,
    lastMessage: '',
    lastMessageAt: null,
    unreadCount
  };

  await ref.set(doc);
  const created = await ref.get();
  return normalizeConversation(created);
}

async function isParticipant(conversationId, uid) {
  const doc = await getDb().collection(CONVERSATIONS).doc(conversationId).get();
  if (!doc.exists) return null;
  const data = doc.data();
  if (!data.participants.includes(uid)) return null;
  return normalizeConversation(doc);
}

async function listConversationsForUser(uid, conversationTypeFilter) {
  let query = getDb().collection(CONVERSATIONS).where('participants', 'array-contains', uid);
  const snap = await query.get();
  let conversations = snap.docs.map((doc) => normalizeConversation(doc));
  if (conversationTypeFilter) {
    conversations = conversations.filter((c) => c.conversationType === conversationTypeFilter);
  }
  conversations.sort((a, b) => {
    const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    return tb - ta;
  });
  return conversations;
}

async function sendMessage(conversationId, senderProfile, text) {
  const trimmed = typeof text === 'string' ? text.trim() : '';
  if (!trimmed) throw new Error('Message text is required');
  if (trimmed.length > MAX_MESSAGE_LENGTH) throw new Error(`Message exceeds ${MAX_MESSAGE_LENGTH} characters`);

  const conversation = await isParticipant(conversationId, senderProfile.uid);
  if (!conversation) throw new Error('Conversation not found or access denied');

  const db = getDb();
  const msgRef = db.collection(CONVERSATIONS).doc(conversationId).collection('messages').doc();
  const now = admin.firestore.FieldValue.serverTimestamp();

  const messageDoc = {
    messageId: msgRef.id,
    conversationId,
    senderId: senderProfile.uid,
    senderRole: senderProfile.role,
    text: trimmed,
    createdAt: now,
    readBy: [senderProfile.uid]
  };

  const convRef = db.collection(CONVERSATIONS).doc(conversationId);
  const unreadUpdates = {};
  conversation.participants.forEach((pid) => {
    if (pid !== senderProfile.uid) {
      unreadUpdates[`unreadCount.${pid}`] = admin.firestore.FieldValue.increment(1);
    }
  });

  await db.runTransaction(async (tx) => {
    tx.set(msgRef, messageDoc);
    tx.update(convRef, {
      lastMessage: trimmed.slice(0, 200),
      lastMessageAt: now,
      updatedAt: now,
      ...unreadUpdates
    });
  });

  const saved = await msgRef.get();
  return normalizeMessage(saved);
}

async function getMessages(conversationId, uid, limit = 100) {
  const conversation = await isParticipant(conversationId, uid);
  if (!conversation) throw new Error('Conversation not found or access denied');

  const snap = await getDb()
    .collection(CONVERSATIONS)
    .doc(conversationId)
    .collection('messages')
    .orderBy('createdAt', 'asc')
    .limit(limit)
    .get();

  return snap.docs.map((doc) => normalizeMessage(doc));
}

async function markMessagesRead(conversationId, uid) {
  const conversation = await isParticipant(conversationId, uid);
  if (!conversation) throw new Error('Conversation not found or access denied');

  const db = getDb();
  const snap = await db
    .collection(CONVERSATIONS)
    .doc(conversationId)
    .collection('messages')
    .orderBy('createdAt', 'desc')
    .limit(100)
    .get();

  const batch = db.batch();
  let hasUpdates = false;
  snap.docs.forEach((doc) => {
    const readBy = doc.data().readBy || [];
    if (!readBy.includes(uid) && doc.data().senderId !== uid) {
      batch.update(doc.ref, { readBy: admin.firestore.FieldValue.arrayUnion(uid) });
      hasUpdates = true;
    }
  });

  batch.update(db.collection(CONVERSATIONS).doc(conversationId), {
    [`unreadCount.${uid}`]: 0,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  await batch.commit();
  return { success: true };
}

async function getAuthorizedContacts(profile, conversationType) {
  if (conversationType === 'student_counselor') {
    if (profile.role === 'student') {
      if (!profile.assignedCounselorId) return [];
      const counselor = await getUserByUid(profile.assignedCounselorId);
      return counselor ? [counselor] : [];
    }
    if (profile.role === 'counselor') {
      const students = await getDb()
        .collection('users')
        .where('assignedCounselorId', '==', profile.uid)
        .get();
      return students.docs.map((doc) => ({
        uid: doc.id,
        name: doc.data().name || '',
        email: doc.data().email || '',
        role: doc.data().role || 'student',
        studentId: doc.data().studentId || ''
      }));
    }
  }

  if (conversationType === 'teacher_counselor') {
    if (profile.role === 'teacher') {
      return listUsersByRole('counselor');
    }
    if (profile.role === 'counselor') {
      return listUsersByRole('teacher');
    }
  }

  if (conversationType === 'student_teacher') {
    if (profile.role === 'student') {
      const ids = profile.authorizedTeacherIds || [];
      const teachers = await Promise.all(ids.map((id) => getUserByUid(id)));
      return teachers.filter(Boolean);
    }
    if (profile.role === 'teacher') {
      const snap = await getDb()
        .collection('users')
        .where('authorizedTeacherIds', 'array-contains', profile.uid)
        .get();
      return snap.docs.map((doc) => ({
        uid: doc.id,
        name: doc.data().name || '',
        email: doc.data().email || '',
        role: 'student',
        studentId: doc.data().studentId || ''
      }));
    }
  }

  return [];
}

module.exports = {
  buildConversationId,
  getOrCreateConversation,
  listConversationsForUser,
  sendMessage,
  getMessages,
  markMessagesRead,
  getAuthorizedContacts,
  isParticipant,
  MAX_MESSAGE_LENGTH
};
