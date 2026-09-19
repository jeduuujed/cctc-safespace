import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import AppHeader from '../../components/AppHeader';
import PageShell from '../../components/PageShell';
import { API_BASE } from '../../lib/api';

function statusBadgeClass(status) {
  if (status === 'Resolved') return 'badge badge--resolved';
  if (status === 'Under Review') return 'badge badge--review';
  if (status === 'Received' || status === 'Pending') return 'badge badge--received';
  return 'badge badge--review';
}

function priorityBadgeClass(p) {
  if (p === 'High') return 'badge badge--high';
  if (p === 'Critical') return 'badge badge--critical';
  return 'badge badge--medium';
}

const STATUSES = ['Pending', 'Received', 'Under Review', 'Resolved'];

export default function AdminReports() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login?next=/admin/reports');
        return;
      }
      try {
        const token = await user.getIdToken();
        const res = await fetch(`${API_BASE}/api/reports`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) {
          setReports([]);
          setLoading(false);
          return;
        }
        const reportsFromApi = data.reports || []; 
        setReports(reportsFromApi.map((report) => ({
          id: report.id,
          code: report.reportId || report.id.slice(0, 6).toUpperCase(),
          anonymous: !!report.anonymous,
          priority: report.priority || 'Medium',
          type: report.category || 'Incident',
          student: report.anonymous ? 'Anonymous' : report.reporterName || 'Student',
          date: report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'Unknown',
          status: report.status || 'Pending',
          assigned: report.assignedTo || 'Unassigned',
          description: report.summary || report.generatedReport || 'No description provided.',
          severity: report.priority || 'Medium',
          raw: report
        })));
      } catch (err) {
        console.error(err);
        setReports([]);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return reports.filter((r) => {
      const matchSearch =
        !s ||
        r.code.toLowerCase().includes(s) ||
        r.type.toLowerCase().includes(s) ||
        r.student.toLowerCase().includes(s);
      const matchStatus = statusFilter === 'All Status' || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [reports, search, statusFilter]);

  const stats = useMemo(() => {
    const total = reports.length;
    const pending = reports.filter((r) => r.status === 'Received' || r.status === 'Pending').length;
    const inProg = reports.filter((r) => r.status === 'Under Review').length;
    const resolved = reports.filter((r) => r.status === 'Resolved').length;
    const critical = reports.filter((r) => r.priority === 'Critical').length;
    return { total, pending, inProg, resolved, critical };
  }, [reports]);

  const user = auth.currentUser;
  const userLine = user ? `${user.email?.split('@')[0] || 'admin'} (Counselor)` : '';

  if (!auth.currentUser) {
    return null;
  }

  if (loading) {
    return (
      <>
        <AppHeader variant="admin" admin userLine={userLine} onLogout={() => signOut(auth)} />
        <PageShell>
          <p>Loading...</p>
        </PageShell>
      </>
    );
  }

  return (
    <>
      <AppHeader variant="admin" admin userLine={userLine} onLogout={() => signOut(auth)} />
      <PageShell style={{ paddingBottom: '2.5rem' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div
            style={{
              background: '#fff',
              borderRadius: 'var(--radius-card)',
              boxShadow: 'var(--shadow-card)',
              padding: '1.25rem 1.5rem',
              marginBottom: '1.25rem',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 28 }}>📄</span>
              <div>
                <h1 style={{ margin: 0, fontSize: '1.25rem' }}>Reports Management</h1>
                <p style={{ margin: '4px 0 0', fontSize: 14, color: '#555' }}>
                  View and manage all incident reports.
                </p>
              </div>
            </div>
            <Link href="/admin/dashboard" style={{ fontWeight: 600, fontSize: 14 }}>
              Back to Dashboard
            </Link>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 12,
              marginBottom: '1.25rem'
            }}
          >
            {[
              { label: 'Total Reports', n: stats.total, c: '#111' },
              { label: 'Pending', n: stats.pending, c: '#ea580c' },
              { label: 'In Progress', n: stats.inProg, c: '#2563eb' },
              { label: 'Resolved', n: stats.resolved, c: '#16a34a' },
              { label: 'Critical', n: stats.critical, c: '#dc2626' }
            ].map((x) => (
              <div
                key={x.label}
                style={{
                  background: '#fff',
                  borderRadius: 12,
                  padding: '1rem',
                  boxShadow: 'var(--shadow-card)',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: 13, color: '#555' }}>{x.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: x.c, marginTop: 4 }}>{x.n}</div>
              </div>
            ))}
          </div>

          <section
            style={{
              background: '#fff',
              borderRadius: 'var(--radius-card)',
              boxShadow: 'var(--shadow-card)',
              padding: '1.25rem 1.35rem'
            }}
          >
            <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: '1 1 240px' }}>
                <span style={{ position: 'absolute', left: 10, top: 10, opacity: 0.5 }}>🔍</span>
                <input
                  type="search"
                  placeholder="Search by ID, type, or student...."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    borderRadius: 10,
                    border: '1px solid var(--color-border)',
                    fontSize: 14
                  }}
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid var(--color-border)',
                  fontSize: 14,
                  minWidth: 140
                }}
              >
                <option>All Status</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            {filtered.map((r) => (
              <div
                key={r.id}
                style={{
                  padding: '14px 0',
                  borderTop: '1px solid #eee',
                  fontSize: 14
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <strong>#{r.code}</strong>{' '}
                    {r.anonymous && (
                      <span className="badge" style={{ background: '#f3f4f6', color: '#444' }}>
                        Anonymous
                      </span>
                    )}{' '}
                    <span className={priorityBadgeClass(r.priority)}>{r.priority}</span>
                    <div style={{ fontWeight: 700, marginTop: 6 }}>{r.type}</div>
                    <div style={{ color: '#555', fontSize: 13 }}>
                      {r.student} · {r.date}
                    </div>
                    <div style={{ color: '#666', fontSize: 12, marginTop: 6 }}>{r.description}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={statusBadgeClass(r.status)}>{r.status}</span>
                    <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>Assigned: {r.assigned}</div>
                  </div>
                </div>
              </div>
            ))}
          </section>
        </div>
      </PageShell>
    </>
  );
}
