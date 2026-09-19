import { isAdminEmail } from './admin';

export const ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  COUNSELOR: 'counselor',
  ADMIN: 'admin'
};

export function getDashboardPath(role, email) {
  if (role === ROLES.ADMIN || (role !== ROLES.COUNSELOR && role !== ROLES.TEACHER && isAdminEmail(email))) {
    return '/admin/dashboard';
  }
  if (role === ROLES.COUNSELOR) return '/counselor/dashboard';
  if (role === ROLES.TEACHER) return '/teacher/dashboard';
  return '/dashboard';
}

export function getRoleLabel(role) {
  const labels = {
    student: 'Student',
    teacher: 'Teacher',
    counselor: 'Counselor',
    admin: 'Administrator'
  };
  return labels[role] || 'User';
}

export function getMessagingTypesForRole(role) {
  if (role === 'student') {
    return [
      { id: 'student_counselor', label: 'Counselor' },
      { id: 'student_teacher', label: 'Teachers' }
    ];
  }
  if (role === 'teacher') {
    return [
      { id: 'student_teacher', label: 'Students' },
      { id: 'teacher_counselor', label: 'Counselors' }
    ];
  }
  if (role === 'counselor') {
    return [
      { id: 'student_counselor', label: 'Students' },
      { id: 'teacher_counselor', label: 'Teachers' }
    ];
  }
  return [];
}
