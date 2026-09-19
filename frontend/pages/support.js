import { useEffect } from 'react';
import { useRouter } from 'next/router';
import AppHeader from '../components/AppHeader';
import PageShell from '../components/PageShell';
import { useAuthUser } from '../hooks/useStudentAuth';

export default function Support() {
  const router = useRouter();
  const user = useAuthUser();

  useEffect(() => {
    if (user === null && router.isReady) {
      router.replace('/login?next=/support');
    }
  }, [user, router]);

  if (user === undefined) {
    return (
      <>
        <AppHeader variant="student" backHref="/dashboard" backLabel="Back to Dashboard" />
        <PageShell>
          <p>Loading...</p>
        </PageShell>
      </>
    );
  }

  if (user === null) return null;

  const name = user.displayName || user.email?.split('@')[0] || 'student';

  return (
    <>
      <AppHeader
        variant="student"
        userLine={`Welcome, ${name}`}
        backHref="/dashboard"
        backLabel="Back to Dashboard"
      />
      <PageShell>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }} aria-hidden>
              ♡
            </div>
            <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.65rem' }}>Support Resources</h1>
            <p style={{ margin: 0, color: '#333', fontSize: 15, lineHeight: 1.5, maxWidth: 520, marginInline: 'auto' }}>
              You&apos;re not alone. Access mental health support, guidance contacts, and anti-bullying resources.
            </p>
          </div>

          <div
            style={{
              border: '2px solid #e85d4c',
              borderRadius: 'var(--radius-card)',
              background: 'rgba(232, 241, 254, 0.85)',
              padding: '1.25rem 1.35rem',
              marginBottom: '1.5rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 22 }} aria-hidden>
                📞
              </span>
              <strong style={{ fontSize: 16 }}>Emergency Contacts</strong>
            </div>
            <p style={{ margin: '0 0 1rem', fontSize: 14 }}>If you&apos;re in immediate danger, please contact:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div
                style={{
                  background: '#e8eaed',
                  borderRadius: 10,
                  padding: '12px 14px',
                  fontSize: 14
                }}
              >
                <strong>Campus Security</strong>
                <div style={{ marginTop: 4, color: '#333' }}>Local: 2345 | Mobile: 0917-123-4567</div>
              </div>
              <div
                style={{
                  background: '#e8eaed',
                  borderRadius: 10,
                  padding: '12px 14px',
                  fontSize: 14
                }}
              >
                <strong>National Emergency Hotline</strong>
                <div style={{ marginTop: 4 }}>911</div>
              </div>
            </div>
          </div>

          <div
            style={{
              background: '#fff',
              borderRadius: 'var(--radius-card)',
              boxShadow: 'var(--shadow-card)',
              border: '1px solid var(--color-border)',
              padding: '1.35rem 1.5rem 0',
              overflow: 'hidden'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 22 }} aria-hidden>
                👥
              </span>
              <strong style={{ fontSize: 16 }}>CCTC Guidance Office</strong>
            </div>
            <p style={{ margin: '0 0 1.25rem', fontSize: 14, color: '#444' }}>
              Our trained counselors are available to provide support, guidance, and intervention.
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 14,
                marginBottom: '1.25rem'
              }}
            >
              {[
                {
                  name: 'Ms. Maria Santos',
                  title: 'Head Guidance Counselor',
                  phone: 'Local 3456',
                  email: 'm.santos@cctc.edu'
                },
                {
                  name: 'Mr. Roberto Reyes',
                  title: 'Guidance Counselor',
                  phone: 'Local 3457',
                  email: 'r.reyes@cctc.edu'
                }
              ].map((c) => (
                <div
                  key={c.name}
                  style={{
                    border: '1px solid var(--color-border)',
                    borderRadius: 10,
                    padding: '1rem 1.1rem',
                    fontSize: 14
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{c.name}</div>
                  <div style={{ color: '#555', marginTop: 4 }}>{c.title}</div>
                  <div style={{ marginTop: 10 }}>📞 {c.phone}</div>
                  <div style={{ marginTop: 4 }}>✉️ {c.email}</div>
                </div>
              ))}
            </div>
            <div
              style={{
                background: '#c4b5fd',
                margin: '0 -1.5rem 0',
                padding: '12px 1.5rem',
                fontSize: 13,
                lineHeight: 1.5
              }}
            >
              <strong>Office Hours:</strong> Monday – Friday, 8:00 AM – 5:00 PM
              <br />
              <strong>Location:</strong> Student Services Building, 2nd Floor
            </div>
          </div>
        </div>
      </PageShell>
    </>
  );
}
