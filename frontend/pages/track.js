import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AppHeader from '../components/AppHeader';
import PageShell from '../components/PageShell';
import { useAuthUser } from '../hooks/useStudentAuth';
import { getMyReports } from '../lib/userProfile';

export default function TrackCases() {
  const router = useRouter();
  const user = useAuthUser();
  const [reports, setReports] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    if (user === null && router.isReady) {
      router.replace('/login?next=/track');
    }
  }, [user, router]);

  useEffect(() => {
    if (!user) return undefined;
    getMyReports(user)
      .then((data) => {
        const next = data.reports || [];
        setReports(next);
        setSelectedId(next[0]?.id || null);
      })
      .catch(() => setReports([]));
    return undefined;
  }, [user]);

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
  const selected = reports.find((report) => report.id === selectedId);

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
          <h1 style={{ margin: '0 0 0.35rem', fontSize: '1.5rem' }}>Case Status Tracking</h1>
          <p style={{ margin: '0 0 1.5rem', color: '#444', fontSize: 15 }}>
            Track identifiable reports submitted under your account. Anonymous submissions are kept off this list.
          </p>
          {reports.length === 0 && (
            <div style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', boxShadow: 'var(--shadow-card)' }}>
              No identifiable reports yet.
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {reports.map((report) => (
              <button
                key={report.id}
                type="button"
                onClick={() => setSelectedId(report.id)}
                style={{
                  textAlign: 'left',
                  background: '#fff',
                  borderRadius: 16,
                  border: selectedId === report.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  padding: '1rem 1.25rem',
                  boxShadow: 'var(--shadow-card)'
                }}
              >
                <strong>#{report.reportId || report.id}</strong>
                <div style={{ marginTop: 6 }}>{report.category || 'Incident'}</div>
                <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
                  {report.status || 'Pending'} · {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : ''}
                </div>
              </button>
            ))}
          </div>
          {selected && (
            <div style={{ marginTop: 16, background: '#fff', borderRadius: 16, padding: '1.25rem', boxShadow: 'var(--shadow-card)' }}>
              <h2 style={{ marginTop: 0 }}>Report details</h2>
              <p>{selected.summary || selected.generatedReport || 'No summary yet.'}</p>
              <p style={{ fontSize: 14, color: '#555' }}>Assigned to: {selected.assignedTo || 'Unassigned'}</p>
            </div>
          )}
        </div>
      </PageShell>
    </>
  );
}
