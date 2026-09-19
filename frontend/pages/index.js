import Link from 'next/link';
import AppHeader from '../components/AppHeader';
import PageShell from '../components/PageShell';
import LogoSeal from '../components/LogoSeal';

export default function Home() {
  return (
    <>
      <AppHeader variant="landing" />
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
            padding: '2.5rem 2rem',
            maxWidth: 440,
            width: '100%',
            textAlign: 'center'
          }}
        >
          <div
            style={{
              width: 88,
              height: 88,
              margin: '0 auto 1.25rem',
              borderRadius: '50%',
              background: '#e8f1fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <LogoSeal size={64} />
          </div>
          <h1 style={{ margin: '0 0 0.75rem', fontSize: '1.75rem', fontWeight: 700 }}>CCTC SafeSpace</h1>
          <p style={{ margin: '0 0 1.75rem', color: '#333', lineHeight: 1.5, fontSize: 15 }}>
            A Web-Based AI Platform for Student Protection and Anti-Bullying Advocacy
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/login"
              style={{
                background: 'var(--color-primary)',
                color: '#fff',
                padding: '12px 22px',
                borderRadius: 10,
                fontWeight: 600,
                textDecoration: 'none',
                fontSize: 15
              }}
            >
              Report Incident
            </Link>
            <Link
              href="/register"
              style={{
                background: '#fff',
                color: 'var(--color-primary)',
                padding: '12px 22px',
                borderRadius: 10,
                fontWeight: 600,
                textDecoration: 'none',
                fontSize: 15,
                border: '2px solid var(--color-primary)'
              }}
            >
              Create Account
            </Link>
          </div>
          <p style={{ marginTop: '1.35rem', fontSize: 14, color: '#444' }}>
            Already have an account? <Link href="/login">Sign in</Link>
          </p>
        </div>
      </PageShell>
    </>
  );
}
