import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import AppHeader from '../../components/AppHeader';
import PageShell from '../../components/PageShell';
import { useUserProfile } from '../../hooks/useUserProfile';
import { adminUpdateUser, listAllUsers } from '../../lib/userProfile';
import { getRoleLabel } from '../../lib/roles';

export default function AdminUsersPage() {
  const router = useRouter();
  const { user, profile, loading } = useUserProfile();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'admin')) {
      router.replace('/login?next=/admin/users');
    }
  }, [loading, user, profile, router]);

  const reload = async () => {
    const data = await listAllUsers(user);
    setUsers(data.users || []);
  };

  useEffect(() => {
    if (!user || profile?.role !== 'admin') return;
    reload().catch((err) => setError(err.message || 'Failed to load users'));
  }, [user, profile]);

  const counselors = users.filter((item) => item.role === 'counselor');
  const teachers = users.filter((item) => item.role === 'teacher');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter((item) => `${item.name} ${item.email} ${item.studentId} ${item.role}`.toLowerCase().includes(q));
  }, [users, search]);

  const saveUser = async (uid, updates) => {
    setError('');
    setSaving(uid);
    try {
      const data = await adminUpdateUser(user, uid, updates);
      setUsers((prev) => prev.map((item) => (item.uid === uid ? data.profile : item)));
    } catch (err) {
      setError(err.message || 'Update failed');
    } finally {
      setSaving('');
    }
  };

  if (loading || profile?.role !== 'admin') {
    return (
      <>
        <AppHeader variant="admin" admin />
        <PageShell>
          <p>Loading...</p>
        </PageShell>
      </>
    );
  }

  return (
    <>
      <AppHeader variant="admin" admin userLine={profile.email} backHref="/admin/dashboard" backLabel="Back to Admin" />
      <PageShell>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h1>Manage Users and Access</h1>
          <p style={{ color: '#555' }}>
            Only administrators can assign roles, counselors, and teacher access. Users cannot grant themselves
            privileged roles.
          </p>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, student ID..."
            style={{ width: '100%', maxWidth: 360, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border)', marginBottom: 16 }}
          />
          {error && <p style={{ color: '#b91c1c' }}>{error}</p>}
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: 'var(--shadow-card)', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ textAlign: 'left', background: '#f8fafc' }}>
                  <th style={{ padding: 10 }}>User</th>
                  <th>Role</th>
                  <th>Student ID</th>
                  <th>Counselor</th>
                  <th>Teachers</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.uid} style={{ borderTop: '1px solid #eee' }}>
                    <td style={{ padding: 10 }}>
                      <div style={{ fontWeight: 700 }}>{item.name || 'Unnamed'}</div>
                      <div style={{ color: '#666' }}>{item.email}</div>
                    </td>
                    <td>
                      <select
                        value={item.role}
                        disabled={item.uid === user.uid || saving === item.uid}
                        onChange={(e) => saveUser(item.uid, { role: e.target.value })}
                      >
                        {['student', 'teacher', 'counselor', 'admin'].map((role) => (
                          <option key={role} value={role}>
                            {getRoleLabel(role)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        defaultValue={item.studentId}
                        style={{ width: 90 }}
                        onBlur={(e) => {
                          if (e.target.value !== item.studentId) saveUser(item.uid, { studentId: e.target.value });
                        }}
                      />
                    </td>
                    <td>
                      <select
                        value={item.assignedCounselorId || ''}
                        onChange={(e) => saveUser(item.uid, { assignedCounselorId: e.target.value || null })}
                      >
                        <option value="">None</option>
                        {counselors.map((counselor) => (
                          <option key={counselor.uid} value={counselor.uid}>
                            {counselor.name || counselor.email}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        multiple
                        value={item.authorizedTeacherIds || []}
                        onChange={(e) => {
                          const ids = Array.from(e.target.selectedOptions).map((option) => option.value);
                          saveUser(item.uid, { authorizedTeacherIds: ids });
                        }}
                        style={{ minWidth: 140, minHeight: 64 }}
                      >
                        {teachers.map((teacher) => (
                          <option key={teacher.uid} value={teacher.uid}>
                            {teacher.name || teacher.email}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </PageShell>
    </>
  );
}
