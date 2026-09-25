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
const admin = { uid: 'a1', role: 'admin' };
const otherAdmin = { uid: 'a2', role: 'admin' };

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

test('student and admin can message each other exclusively', () => {
  const ok = evaluateConversationAccess(student, 'student_admin', admin);
  assert.equal(ok.ok, true);
  assert.equal(ok.roles[student.uid], 'student');
  assert.equal(ok.roles[admin.uid], 'admin');

  const adminInitiated = evaluateConversationAccess(admin, 'student_admin', student);
  assert.equal(adminInitiated.ok, true);
  assert.deepEqual(adminInitiated.participants, [student.uid, admin.uid]);
});

test('student_admin is denied for anyone other than student and admin', () => {
  assert.equal(evaluateConversationAccess(student, 'student_admin', otherStudent).ok, false);
  assert.equal(evaluateConversationAccess(counselor, 'student_admin', student).ok, false);
  assert.equal(evaluateConversationAccess(teacher, 'student_admin', student).ok, false);
  assert.equal(evaluateConversationAccess(admin, 'student_admin', otherAdmin).ok, false);
});

test('role conversation types stay separated', () => {
  assert.deepEqual(getConversationTypesForRole('student'), ['student_counselor', 'student_teacher', 'student_admin']);
  assert.deepEqual(getConversationTypesForRole('teacher'), ['teacher_counselor', 'student_teacher']);
  assert.deepEqual(getConversationTypesForRole('counselor'), ['student_counselor', 'teacher_counselor']);
  assert.deepEqual(getConversationTypesForRole('admin'), ['student_counselor', 'teacher_counselor', 'student_teacher', 'student_admin']);
});
