const { test } = require('node:test');
const assert = require('node:assert/strict');
const { evaluateConversationAccess, getConversationTypesForRole } = require('../services/conversationPolicy');

const student = {
  uid: 's1',
  role: 'student',
  assignedCounselorId: 'c1',
  authorizedTeacherIds: ['t1']
};
const otherStudent = {
  uid: 's2',
  role: 'student',
  assignedCounselorId: 'c1',
  authorizedTeacherIds: ['t1']
};
const counselor = { uid: 'c1', role: 'counselor' };
const otherCounselor = { uid: 'c2', role: 'counselor' };
const teacher = { uid: 't1', role: 'teacher' };
const unauthorizedTeacher = { uid: 't2', role: 'teacher' };

test('student can only message assigned counselor', () => {
  const ok = evaluateConversationAccess(student, 'student_counselor', counselor);
  assert.equal(ok.ok, true);
  const denied = evaluateConversationAccess(student, 'student_counselor', otherCounselor);
  assert.equal(denied.ok, false);
});

test('counselor cannot message unassigned student', () => {
  const unassigned = { ...otherStudent, assignedCounselorId: 'c2' };
  const denied = evaluateConversationAccess(counselor, 'student_counselor', unassigned);
  assert.equal(denied.ok, false);
});

test('student cannot read another student conversation path', () => {
  const denied = evaluateConversationAccess(student, 'student_teacher', otherStudent);
  assert.equal(denied.ok, false);
});

test('teacher cannot message unauthorized student', () => {
  const denied = evaluateConversationAccess(unauthorizedTeacher, 'student_teacher', student);
  assert.equal(denied.ok, false);
  const allowed = evaluateConversationAccess(teacher, 'student_teacher', student);
  assert.equal(allowed.ok, true);
});

test('teacher and counselor can message each other separately from student chats', () => {
  const ok = evaluateConversationAccess(teacher, 'teacher_counselor', counselor);
  assert.equal(ok.ok, true);
  assert.equal(ok.roles[teacher.uid], 'teacher');
  const denied = evaluateConversationAccess(teacher, 'student_counselor', student);
  assert.equal(denied.ok, false);
});

test('role conversation types stay separated', () => {
  assert.deepEqual(getConversationTypesForRole('student'), ['student_counselor', 'student_teacher']);
  assert.deepEqual(getConversationTypesForRole('teacher'), ['teacher_counselor', 'student_teacher']);
  assert.deepEqual(getConversationTypesForRole('counselor'), ['student_counselor', 'teacher_counselor']);
});
