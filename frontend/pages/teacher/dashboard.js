import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import AppHeader from '../../components/AppHeader';
import PageShell from '../../components/PageShell';
import { useUserProfile } from '../../hooks/useUserProfile';
import { getDashboardPath } from '../../lib/roles';

export default function TeacherDashboard() {
  const router = useRouter();
  const { user, profile, loading } = useUserProfile();

  useEffect(() => {
    if (!loading && user === null) router.replace('/login?next=/teacher/dashboard');
  }, [loading, user, router]);

  useEffect(() => {
    if (profile && profile.role !== 'teacher' && profile.role !== 'admin') {
      router.replace(getDashboardPath(profile.role, profile.email));
    }
  }, [profile, router]);

  const handleLogout = () => signOut(auth);

  if (loading || !profile) {
    return (
      <>
        <AppHeader variant="teacher" />
        <PageShell>
          <p>Loading...</p>
        </PageShell>
      </>
    );
  }

  return (
    <>
      <AppHeader variant="teacher" userLine={`Welcome, ${profile.name || profile.email}`} showStudentLogout onLogout={handleLogout} />
      <PageShell>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <section
            style={{
              background: 'var(--color-primary)',
              borderRadius: 'var(--radius-card)',
              padding: '1.75rem 1.5rem',
              color: '#fff',
              marginBottom: '1.5rem'
            }}
          >
            <h1 style={{ margin: '0 0 0.5rem' }}>Teacher Dashboard</h1>
            <p style={{ margin: 0, opacity: 0.95 }}>Message authorized students and counselors. Student-counselor chats stay private.</p>
          </section>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            {[
              { href: '/messages?type=student_teacher', title: 'Student Conversations', sub: 'Authorized students only' },
              { href: '/messages?type=teacher_counselor', title: 'Messages', sub: 'Talk with counselors' },
              { href: '/account', title: 'Account Settings', sub: 'Profile and face login' }
            ].map((card) => (
              <Link
                key={card.title}
                href={card.href}
                style={{ background: '#fff', padding: '1rem', borderRadius: 12, boxShadow: 'var(--shadow-card)', textDecoration: 'none', color: '#111' }}
              >
                <div style={{ fontWeight: 700 }}>{card.title}</div>
                <div style={{ fontSize: 13, color: '#555', marginTop: 6 }}>{card.sub}</div>
              </Link>
            ))}
          </div>
        </div>
      </PageShell>
    </>
  );
}
