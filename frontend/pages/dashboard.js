import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import AppHeader from '../components/AppHeader';
import PageShell from '../components/PageShell';
import { useUserProfile } from '../hooks/useUserProfile';
import { getMyReports } from '../lib/userProfile';
import { getDashboardPath } from '../lib/roles';

function priorityBadge(priority) {
  if (priority === 'High' || priority === 'high') return { className: 'badge badge--high', label: 'High Priority' };
  if (priority === 'Critical') return { className: 'badge badge--critical', label: 'Critical' };
  return { className: 'badge badge--medium', label: 'Medium Priority' };
}

function statusBadge(status) {
  if (status === 'Resolved' || status === 'resolved') return { className: 'badge badge--resolved', label: 'Resolved' };
  return { className: 'badge badge--review', label: status || 'Under Review' };
}

export default function StudentDashboard() {
  const router = useRouter();
  const { user, profile, loading } = useUserProfile();
  const [reports, setReports] = useState([]);

  useEffect(() => {
    if (!loading && user === null) {
      router.replace('/login?next=/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!profile) return;
    const dest = getDashboardPath(profile.role, profile.email);
    if (dest !== '/dashboard') {
      router.replace(dest);
    }
  }, [profile, router]);

  useEffect(() => {
    if (!user || !profile || profile.role !== 'student') return undefined;
    getMyReports(user)
      .then((data) => setReports(data.reports || []))
      .catch(() => setReports([]));
    return undefined;
  }, [user, profile]);

  const handleLogout = () => signOut(auth);

  if (loading || user === null) {
    return (
      <>
        <AppHeader variant="student" />
        <PageShell>
          <p>Loading...</p>
        </PageShell>
      </>
    );
  }

  const name = profile?.name || user.displayName || user.email?.split('@')[0] || 'student';

  return (
    <>
      <AppHeader
        variant="student"
        userLine={`Welcome, ${name}`}
        showStudentLogout
        onLogout={handleLogout}
      />
      <PageShell style={{ paddingBottom: '3rem' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <section
            style={{
              background: 'var(--color-primary)',
              borderRadius: 'var(--radius-card)',
              padding: '1.75rem 1.5rem 1.5rem',
              color: '#fff',
              marginBottom: '1.75rem'
            }}
          >
            <h1 style={{ margin: '0 0 0.35rem', fontSize: '1.65rem' }}>Student Dashboard</h1>
            <p style={{ margin: '0 0 1.5rem', opacity: 0.95, fontSize: 14, maxWidth: 560 }}>
              Your safe space to report incidents, talk with authorized staff, and access support resources.
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 12
              }}
            >
              {[
                { href: '/report', icon: '💬', title: 'AI Chatbot', sub: 'Guided incident questions' },
                { href: '/report', icon: '📝', title: 'Submit Incident Report', sub: 'Chat, evidence, submit' },
                { href: '/track', icon: '📊', title: 'My Reports', sub: 'View report status' },
                { href: '/messages', icon: '✉️', title: 'Messages', sub: 'Counselor and teachers' },
                { href: '/account', icon: '⚙', title: 'Account Settings', sub: 'Profile and face login' },
                { href: '/support', icon: '♡', title: 'Get Support', sub: 'Mental health resources' }
              ].map((c) => (
                <Link
                  key={c.title}
                  href={c.href}
                  style={{
                    background: '#fff',
                    color: '#111',
                    borderRadius: 12,
                    padding: '1rem',
                    textDecoration: 'none',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                  }}
                >
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{c.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{c.title}</div>
                  <div style={{ fontSize: 12, color: '#5f6368', marginTop: 4 }}>{c.sub}</div>
                </Link>
              ))}
            </div>
          </section>

          <section
            style={{
              background: '#fff',
              borderRadius: 'var(--radius-card)',
              boxShadow: 'var(--shadow-card)',
              padding: '1.25rem 1.5rem 1.5rem',
              marginBottom: '1.5rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem' }}>My Reports</h2>
              <Link href="/track" style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 4 }}>
                View All <span aria-hidden>→</span>
              </Link>
            </div>
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {reports.length === 0 && (
                <p style={{ color: '#555', fontSize: 14 }}>
                  No identifiable reports yet. Anonymous reports stay hidden from this list to protect your privacy.
                </p>
              )}
              {reports.slice(0, 5).map((c) => (
                <div
                  key={c.id}
                  style={{
                    border: '1px solid var(--color-border)',
                    borderRadius: 12,
                    padding: '1rem 1.1rem',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'flex-start',
                    gap: 10
                  }}
                >
                  <span style={{ fontSize: 20 }} aria-hidden>
                    📄
                  </span>
                  <div style={{ flex: '1 1 200px' }}>
                    <div style={{ fontWeight: 700 }}>Report #{c.reportId || c.id}</div>
                    <div style={{ fontSize: 14, color: '#333' }}>{c.category || 'Incident'}</div>
                    <div style={{ fontSize: 13, color: 'var(--color-muted)', marginTop: 4 }}>
                      Submitted: {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Unknown'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <span className={priorityBadge(c.priority).className}>{priorityBadge(c.priority).label}</span>
                    <span className={statusBadge(c.status).className}>{statusBadge(c.status).label}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </PageShell>
    </>
  );
}
