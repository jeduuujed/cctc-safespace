import { API_BASE } from './api';
import { isAdminEmail } from './admin';

async function getFreshToken(user) {
  return user.getIdToken(true);
}

export function fallbackProfileFromUser(user) {
  const email = user?.email || '';
  return {
    uid: user?.uid || '',
    name: user?.displayName || '',
    email,
    role: isAdminEmail(email) ? 'admin' : 'student',
    studentId: '',
    assignedCounselorId: null,
    authorizedTeacherIds: []
  };
}

export async function fetchWithAuth(path, token, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export async function registerUserProfile(user, name, studentId = '') {
  const token = await getFreshToken(user);
  return fetchWithAuth('/api/users/register', token, {
    method: 'POST',
    body: JSON.stringify({ name: name || user.displayName || '', studentId })
  });
}

export async function getMyProfile(user) {
  const token = await getFreshToken(user);
  return fetchWithAuth('/api/users/me', token);
}

export async function updateMyProfile(user, updates) {
  const token = await getFreshToken(user);
  return fetchWithAuth('/api/users/me', token, {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
}

export async function listAllUsers(user) {
  const token = await getFreshToken(user);
  return fetchWithAuth('/api/users', token);
}

export async function adminUpdateUser(user, uid, updates) {
  const token = await getFreshToken(user);
  return fetchWithAuth(`/api/users/${uid}`, token, {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
}

export async function listAssignedStudents(user) {
  const token = await getFreshToken(user);
  return fetchWithAuth('/api/users/assigned-students', token);
}

export async function getMyReports(user) {
  const token = await getFreshToken(user);
  return fetchWithAuth('/api/reports/mine', token);
}
