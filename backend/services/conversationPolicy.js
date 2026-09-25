const VALID_TYPES = ['student_counselor', 'teacher_counselor', 'student_teacher', 'student_admin'];

function evaluateConversationAccess(creatorProfile, type, other) {
  if (!creatorProfile || !other) {
    return { ok: false, error: 'Contact not found' };
  }
  if (!VALID_TYPES.includes(type)) {
    return { ok: false, error: 'Invalid conversation type' };
  }

  const authorizedTeacherIds = Array.isArray(creatorProfile.authorizedTeacherIds)
    ? creatorProfile.authorizedTeacherIds
    : [];
  const otherTeacherIds = Array.isArray(other.authorizedTeacherIds) ? other.authorizedTeacherIds : [];

  if (type === 'student_counselor') {
    if (creatorProfile.role === 'student') {
      if (!creatorProfile.assignedCounselorId) {
        return { ok: false, error: 'No counselor assigned yet' };
      }
      if (other.uid !== creatorProfile.assignedCounselorId || other.role !== 'counselor') {
        return { ok: false, error: 'You can only message your assigned counselor' };
      }
      return {
        ok: true,
        participants: [creatorProfile.uid, other.uid],
        roles: { [creatorProfile.uid]: 'student', [other.uid]: 'counselor' }
      };
    }
    if (creatorProfile.role === 'counselor' && other.role === 'student') {
      if (other.assignedCounselorId !== creatorProfile.uid) {
        return { ok: false, error: 'Student is not assigned to you' };
      }
      return {
        ok: true,
        participants: [creatorProfile.uid, other.uid],
        roles: { [creatorProfile.uid]: 'counselor', [other.uid]: 'student' }
      };
    }
    return { ok: false, error: 'Unauthorized conversation type' };
  }

  if (type === 'teacher_counselor') {
    const pair = [creatorProfile.role, other.role].sort().join('-');
    if (pair !== 'counselor-teacher') {
      return { ok: false, error: 'Teacher-counselor conversations require one teacher and one counselor' };
    }
    const teacherId = creatorProfile.role === 'teacher' ? creatorProfile.uid : other.uid;
    const counselorId = creatorProfile.role === 'counselor' ? creatorProfile.uid : other.uid;
    return {
      ok: true,
      participants: [teacherId, counselorId],
      roles: { [teacherId]: 'teacher', [counselorId]: 'counselor' }
    };
  }

  if (type === 'student_teacher') {
    if (creatorProfile.role === 'student') {
      if (!authorizedTeacherIds.includes(other.uid) || other.role !== 'teacher') {
        return { ok: false, error: 'You are not authorized to message this teacher' };
      }
      return {
        ok: true,
        participants: [creatorProfile.uid, other.uid],
        roles: { [creatorProfile.uid]: 'student', [other.uid]: 'teacher' }
      };
    }
    if (creatorProfile.role === 'teacher' && other.role === 'student') {
      if (!otherTeacherIds.includes(creatorProfile.uid)) {
        return { ok: false, error: 'You are not authorized to message this student' };
      }
      return {
        ok: true,
        participants: [creatorProfile.uid, other.uid],
        roles: { [creatorProfile.uid]: 'teacher', [other.uid]: 'student' }
      };
    }
    return { ok: false, error: 'Unauthorized conversation type' };
  }

  if (type === 'student_admin') {
    const pair = [creatorProfile.role, other.role].sort().join('-');
    if (pair !== 'admin-student') {
      return { ok: false, error: 'Student-admin conversations require one student and one admin' };
    }
    const studentId = creatorProfile.role === 'student' ? creatorProfile.uid : other.uid;
    const adminId = creatorProfile.role === 'admin' ? creatorProfile.uid : other.uid;
    return {
      ok: true,
      participants: [studentId, adminId],
      roles: { [studentId]: 'student', [adminId]: 'admin' }
    };
  }

  return { ok: false, error: 'Invalid conversation type' };
}

function getConversationTypesForRole(role) {
  if (role === 'student') return ['student_counselor', 'student_teacher', 'student_admin'];
  if (role === 'teacher') return ['teacher_counselor', 'student_teacher'];
  if (role === 'counselor') return ['student_counselor', 'teacher_counselor'];
  if (role === 'admin') return VALID_TYPES;
  return [];
}

module.exports = {
  VALID_TYPES,
  evaluateConversationAccess,
  getConversationTypesForRole
};
