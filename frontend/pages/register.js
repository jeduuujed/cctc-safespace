import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebase';
import AppHeader from '../components/AppHeader';
import PageShell from '../components/PageShell';
import LogoSeal from '../components/LogoSeal';
import { registerUserProfile, fallbackProfileFromUser } from '../lib/userProfile';
import { getDashboardPath } from '../lib/roles';

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (name.trim()) {
        await updateProfile(cred.user, { displayName: name.trim() });
      }
      let profile = fallbackProfileFromUser(cred.user);
      try {
        const data = await registerUserProfile(cred.user, name.trim(), studentId.trim());
        if (data.profile) profile = data.profile;
      } catch {
        // Account was created in Firebase. Continue even if backend profile save is unavailable.
      }
      router.push(getDashboardPath(profile?.role, cred.user.email));
    } catch (err) {
      console.error(err);
      setError(err.message || 'Could not create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AppHeader variant="auth" />
      <PageShell
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - var(--header-height))'
        }}
      >
        <div
          style={{
            background: '#fff',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-card)',
            padding: '2rem 2rem 2.25rem',
            maxWidth: 440,
            width: '100%'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <LogoSeal size={80} />
            <h1 style={{ margin: '1rem 0 0.35rem', fontSize: '1.5rem', fontWeight: 700 }}>Create Your Account</h1>
            <p style={{ margin: 0, color: '#444', fontSize: 14 }}>Join SafeSpace to track reports and access support</p>
          </div>

          <form onSubmit={handleRegister}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: '0.35rem' }}>
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-input)',
                  border: '1px solid var(--color-border)'
                }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: '0.35rem' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-input)',
                  border: '1px solid var(--color-border)'
                }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: '0.35rem' }}>
                Student ID
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
                maxLength={32}
                autoComplete="off"
                placeholder="e.g. 2024-00123"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-input)',
                  border: '1px solid var(--color-border)'
                }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: '0.35rem' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-input)',
                  border: '1px solid var(--color-border)'
                }}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: '0.35rem' }}>
                Confirm Password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-input)',
                  border: '1px solid var(--color-border)'
                }}
              />
            </div>

            <p style={{ fontSize: 13, color: '#555', lineHeight: 1.45 }}>
              New accounts start as students. An administrator assigns teacher, counselor, or admin access. You cannot
              choose a privileged role yourself.
            </p>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                border: 'none',
                borderRadius: 'var(--radius-input)',
                background: 'var(--color-primary)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 15,
                marginTop: 4
              }}
            >
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>

          {error && <p style={{ color: '#b91c1c', marginTop: '0.75rem', fontSize: 14 }}>{error}</p>}

          <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: 14, color: '#444' }}>
            Already have an account? <Link href="/login">Sign in</Link>
          </p>
        </div>
      </PageShell>
    </>
  );
}
