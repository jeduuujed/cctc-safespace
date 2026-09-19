import { useState } from 'react';
import AppHeader from '../components/AppHeader';
import PageShell from '../components/PageShell';
import FaceLoginPanel from '../components/FaceLoginPanel';
import { useUserProfile } from '../hooks/useUserProfile';
import { updateMyProfile } from '../lib/userProfile';
import { getDashboardPath, getRoleLabel } from '../lib/roles';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

export default function AccountPage() {
  const { user, profile, loading } = useUserProfile();
  const [name, setName] = useState('');
  const [saved, setSaved] = useState('');
  const [error, setError] = useState('');

  if (loading) {
    return (
      <>
        <AppHeader variant="student" />
        <PageShell>
          <p>Loading...</p>
        </PageShell>
      </>
    );
  }

  if (!user || !profile) {
    return (
      <>
        <AppHeader variant="auth" />
        <PageShell>
          <p>Please sign in to manage your account.</p>
        </PageShell>
      </>
    );
  }

  const variant = profile.role === 'teacher' ? 'teacher' : profile.role === 'counselor' ? 'counselor' : profile.role === 'admin' ? 'admin' : 'student';

  const saveName = async (e) => {
    e.preventDefault();
    setError('');
    setSaved('');
    try {
      await updateMyProfile(user, { name: name || profile.name });
      setSaved('Display name updated.');
    } catch (err) {
      setError(err.message || 'Could not update profile');
    }
  };

  return (
    <>
      <AppHeader
        variant={variant}
        admin={profile.role === 'admin'}
        userLine="Account Settings"
        backHref={getDashboardPath(profile.role, profile.email)}
        backLabel="Back to Dashboard"
      />
      <PageShell>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div
            style={{
              background: '#fff',
              borderRadius: 'var(--radius-card)',
              boxShadow: 'var(--shadow-card)',
              padding: '1.5rem'
            }}
          >
            <h2 style={{ marginTop: 0 }}>Account Settings</h2>
            <p style={{ color: '#555' }}>
              {profile.name || profile.email} · {getRoleLabel(profile.role)}
            </p>
            <form onSubmit={saveName} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={profile.name || 'Display name'}
                style={{ flex: 1, minWidth: 180, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border)' }}
              />
              <button type="submit" style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 16px' }}>
                Save name
              </button>
            </form>
            {saved && <p style={{ color: '#166534' }}>{saved}</p>}
            {error && <p style={{ color: '#b91c1c' }}>{error}</p>}
            <p style={{ fontSize: 14 }}>Email: {profile.email}</p>
            {profile.studentId && <p style={{ fontSize: 14 }}>Student ID: {profile.studentId}</p>}
            <FaceLoginPanel mode="settings" user={user} />
            <div style={{ marginTop: 24 }}>
              <button type="button" onClick={() => signOut(auth)}>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </PageShell>
    </>
  );
}
