import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import AppHeader from '../../components/AppHeader';
import PageShell from '../../components/PageShell';
import { useUserProfile } from '../../hooks/useUserProfile';
import { listAssignedStudents } from '../../lib/userProfile';
import { getDashboardPath } from '../../lib/roles';

export default function CounselorDashboard() {
  const router = useRouter();
  const { user, profile, loading } = useUserProfile();
  const [students, setStudents] = useState([]);

  useEffect(() => {
    if (!loading && user === null) router.replace('/login?next=/counselor/dashboard');
  }, [loading, user, router]);

  useEffect(() => {
    if (profile && profile.role !== 'counselor' && profile.role !== 'admin') {
      router.replace(getDashboardPath(profile.role, profile.email));
    }
  }, [profile, router]);

  useEffect(() => {
    if (!user || !profile) return;
    listAssignedStudents(user)
      .then((data) => setStudents(data.students || []))
      .catch(() => setStudents([]));
  }, [user, profile]);

  const handleLogout = () => signOut(auth);

  if (loading || !profile) {
    return (
      <>
        <AppHeader variant="counselor" />
        <PageShell>
          <p>Loading...</p>
        </PageShell>
      </>
    );
  }

  return (
    <>
      <AppHeader variant="counselor" userLine={`Welcome, ${profile.name || profile.email}`} showStudentLogout onLogout={handleLogout} />
      <PageShell>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <section
            style={{
              background: 'var(--color-primary)',
              borderRadius: 'var(--radius-card)',
              padding: '1.75rem 1.5rem',
              color: '#fff',
              marginBottom: '1.5rem'
            }}
          >
            <h1 style={{ margin: '0 0 0.5rem' }}>Counselor Dashboard</h1>
            <p style={{ margin: 0, opacity: 0.95 }}>
              Student messages, teacher coordination, assigned students, and incident reports.
            </p>
          </section>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
            {[
              { href: '/messages?type=student_counselor', title: 'Student Messages' },
              { href: '/messages?type=teacher_counselor', title: 'Teacher Messages' },
              { href: '/admin/reports', title: 'Incident Reports' },
              { href: '/account', title: 'Account Settings' }
            ].map((card) => (
              <Link
                key={card.title}
                href={card.href}
                style={{ background: '#fff', padding: '1rem', borderRadius: 12, boxShadow: 'var(--shadow-card)', textDecoration: 'none', color: '#111', fontWeight: 700 }}
              >
                {card.title}
              </Link>
            ))}
          </div>
          <section style={{ background: '#fff', borderRadius: 16, boxShadow: 'var(--shadow-card)', padding: '1.25rem 1.5rem' }}>
            <h2 style={{ marginTop: 0 }}>Assigned Students</h2>
            {students.length === 0 && <p style={{ color: '#555' }}>No students are assigned to you yet.</p>}
            {students.map((student) => (
              <div key={student.uid} style={{ padding: '10px 0', borderTop: '1px solid #eee' }}>
                <strong>{student.name || student.email}</strong>
                {student.studentId ? <span style={{ color: '#666' }}> · ID: {student.studentId}</span> : null}
              </div>
            ))}
          </section>
        </div>
      </PageShell>
    </>
  );
}
