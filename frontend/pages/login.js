import { useState } from 'react';
import { signInWithEmailAndPassword, signInWithCustomToken } from 'firebase/auth';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { auth } from '../firebase';
import AppHeader from '../components/AppHeader';
import PageShell from '../components/PageShell';
import LogoSeal from '../components/LogoSeal';
import EmailCodeLoginPanel from '../components/EmailCodeLoginPanel';
import { getDashboardPath } from '../lib/roles';
import { fallbackProfileFromUser, getMyProfile, registerUserProfile } from '../lib/userProfile';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCodeLogin, setShowCodeLogin] = useState(false);

  const nextPath = typeof router.query.next === 'string' ? router.query.next : null;

  const redirectSignedIn = async (firebaseUser) => {
    let profile = fallbackProfileFromUser(firebaseUser);
    try {
      const data = await getMyProfile(firebaseUser);
      if (data.profile) profile = data.profile;
    } catch {
      try {
        const data = await registerUserProfile(firebaseUser, firebaseUser.displayName);
        if (data.profile) profile = data.profile;
      } catch {
        // Backend profile is optional for login. Firebase Auth is the source of truth.
      }
    }
    if (nextPath && nextPath.startsWith('/')) {
      router.push(nextPath);
      return;
    }
    router.push(getDashboardPath(profile?.role, firebaseUser.email));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await redirectSignedIn(userCredential.user);
    } catch (err) {
      console.error(err);
      const code = err?.code || '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setError('Login failed. Please check your email and password.');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please wait and try again.');
      } else if (code === 'auth/network-request-failed') {
        setError('Network error. Check your internet connection and try again.');
      } else {
        setError(err.message || 'Login failed. Please check your credentials.');
      }
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
            borderRadius: 12,
            boxShadow: 'var(--shadow-card)',
            padding: '2rem 2rem 2.25rem',
            maxWidth: 420,
            width: '100%'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <LogoSeal size={72} />
            <h1 className="font-serif" style={{ margin: '1rem 0 0.35rem', fontSize: '1.65rem' }}>
              Welcome Back
            </h1>
            <p style={{ margin: 0, color: '#444', fontSize: 14 }}>Sign in to access your SafeSpace account</p>
          </div>

          <form onSubmit={handleLogin}>
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
                border: '1px solid var(--color-border)',
                marginBottom: '1rem'
              }}
            />

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
                border: '1px solid var(--color-border)',
                marginBottom: '1.25rem'
              }}
            />

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
                fontSize: 15
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {error && <p style={{ color: '#b91c1c', marginTop: '0.75rem', fontSize: 14 }}>{error}</p>}

          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => setShowCodeLogin((value) => !value)}
              style={{
                background: 'transparent',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                padding: '8px 12px'
              }}
            >
              {showCodeLogin ? 'Hide Email Code Login' : 'Login with Gmail Code'}
            </button>
            {showCodeLogin && (
              <EmailCodeLoginPanel
                email={email}
                onAuthenticated={async (customToken) => {
                  const cred = await signInWithCustomToken(auth, customToken);
                  await redirectSignedIn(cred.user);
                }}
              />
            )}
          </div>

          <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: 14, color: '#444' }}>
            Don&apos;t have an account? <Link href="/register">Register here</Link>
          </p>
          <p style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: 12, color: '#666' }}>
            Your dashboard is chosen from your assigned school role, not from this page.
          </p>
        </div>
      </PageShell>
    </>
  );
}
