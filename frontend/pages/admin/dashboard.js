import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import AppHeader from '../../components/AppHeader';
import PageShell from '../../components/PageShell';
import { API_BASE } from '../../lib/api';
import { isAdminEmail } from '../../lib/admin';
import { getStudentReportDetails } from '../../lib/reportDetails';

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

const ASSIGNEES = ['Unassigned', 'Ms. Santos', 'Mr. Reyes'];
const STATUSES = ['Pending', 'Received', 'Under Review', 'Resolved'];

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [editStatus, setEditStatus] = useState('');
  const [editAssigned, setEditAssigned] = useState('');
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login?next=/admin/dashboard');
        return;
      }

      if (!isAdminEmail(user.email)) {
        setReports([]);
        setLoading(false);
        return;
      }

      try {
        const token = await user.getIdToken();
        const res = await fetch(`${API_BASE}/api/reports`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.reports) {
          setReports(data.reports.map((report) => ({
            id: report.id,
            code: report.reportId || report.id.slice(0, 6).toUpperCase(),
            anonymous: !!report.anonymous,
            priority: report.priority || 'Medium',
            type: report.category || 'Incident',
            student: report.anonymous ? 'Anonymous' : report.reporterName || 'Student',
            date: report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'Unknown',
            status: report.status || 'Pending',
            assigned: report.assignedTo || 'Unassigned',
            description: report.summary || (report.generatedReport || 'No description provided.'),
            severity: report.priority || 'Medium',
            raw: report
          })));
        } else {
          setReports([]);
        }
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

  const selected = reports.find((r) => r.id === selectedId);

  useEffect(() => {
    if (selected) {
      setEditStatus(selected.status);
      setEditAssigned(selected.assigned);
      setSaveMsg('');
    }
  }, [selectedId, selected]);

  const stats = useMemo(() => {
    const total = reports.length;
    const pending = reports.filter((r) => r.status === 'Received' || r.status === 'Pending').length;
    const inProg = reports.filter((r) => r.status === 'Under Review').length;
    const resolved = reports.filter((r) => r.status === 'Resolved').length;
    const critical = reports.filter((r) => r.priority === 'Critical' || r.severity === 'Critical').length;
    return { total, pending, inProg, resolved, critical };
  }, [reports]);

  const handleSave = async () => {
    if (!selected) return;
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`${API_BASE}/api/reports/${selected.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: editStatus,
          assignedTo: editAssigned,
          priority: selected.priority
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Update failed');
      }
      setReports((prev) =>
        prev.map((r) =>
          r.id === selected.id ? { ...r, status: editStatus, assigned: editAssigned } : r
        )
      );
      setSaveMsg('Saved changes.');
    } catch (e) {
      console.error(e);
      setSaveMsg('Could not save. Check Firestore rules or your admin token.');
    }
  };

  const user = auth.currentUser;
  const userLine = user ? `${user.email?.split('@')[0] || 'admin'} (Counselor)` : '';

  if (!auth.currentUser) {
    return null;
  }

  if (!isAdminEmail(auth.currentUser.email)) {
    return (
      <>
        <AppHeader variant="admin" admin userLine={auth.currentUser.email || 'admin'} onLogout={() => signOut(auth)} />
        <PageShell>
          <p>Admin access is not enabled for this account.</p>
        </PageShell>
      </>
    );
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
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 12,
              marginBottom: '1.5rem'
            }}
          >
            <Link
              href="/admin/users"
              style={{
                background: '#fff',
                borderRadius: 12,
                padding: '1rem',
                textDecoration: 'none',
                color: '#111',
                boxShadow: 'var(--shadow-card)',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: 26 }}>👥</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 6 }}>Manage Users</div>
            </Link>
            <Link
              href="/admin/reports"
              style={{
                background: '#fff',
                borderRadius: 12,
                padding: '1rem',
                textDecoration: 'none',
                color: '#111',
                boxShadow: 'var(--shadow-card)',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: 26 }}>📄</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 6 }}>View Full Reports</div>
            </Link>
            {[
              { label: 'Total Reports', n: stats.total, icon: '📋', color: '#111' },
              { label: 'Pending', n: stats.pending, icon: '🕐', color: '#ea580c' },
              { label: 'In Progress', n: stats.inProg, icon: '🔽', color: '#2563eb' },
              { label: 'Resolved', n: stats.resolved, icon: '✓', color: '#16a34a' },
              { label: 'Critical', n: stats.critical, icon: '⚠', color: '#dc2626' }
            ].map((c) => (
              <div
                key={c.label}
                style={{
                  background: '#fff',
                  borderRadius: 12,
                  padding: '1rem',
                  boxShadow: 'var(--shadow-card)',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: 22 }}>{c.icon}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: c.color, marginTop: 4 }}>{c.n}</div>
                <div style={{ fontSize: 12, color: '#555' }}>{c.label}</div>
              </div>
            ))}
          </div>

          <div className="admin-dashboard-split">
            <section
              style={{
                background: '#fff',
                borderRadius: 'var(--radius-card)',
                boxShadow: 'var(--shadow-card)',
                padding: '1.25rem 1.35rem'
              }}
            >
              <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>Incident Reports</h2>
              <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: '1 1 200px' }}>
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
              <div>
                {filtered.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedId(r.id)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '14px 0',
                      border: 'none',
                      borderTop: '1px solid #eee',
                      background: selectedId === r.id ? '#f0f7ff' : 'transparent',
                      cursor: 'pointer',
                      fontSize: 14
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
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
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className={statusBadgeClass(r.status)}>{r.status}</span>
                        <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>Assigned: {r.assigned}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section
              style={{
                background: '#fff',
                borderRadius: 'var(--radius-card)',
                boxShadow: 'var(--shadow-card)',
                padding: '1.25rem 1.35rem',
                minHeight: 420
              }}
            >
              <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>Report Details</h2>
              {!selected ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#666' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
                  <strong>Select a report to view details.</strong>
                </div>
              ) : (
                <div style={{ fontSize: 14 }}>
                  <p>
                    <strong>Report ID:</strong> #{selected.code}
                  </p>
                  <p>
                    <strong>Student:</strong> {selected.student}
                  </p>
                  <p>
                    <strong>Incident Type:</strong> {selected.type}
                  </p>
                  <p>
                    <strong>Severity Level:</strong>{' '}
                    <span className={priorityBadgeClass(selected.priority)}>{selected.priority}</span>
                  </p>
                  <label style={{ display: 'block', marginTop: 12, fontWeight: 600 }}>Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    style={{
                      width: '100%',
                      marginTop: 6,
                      padding: '10px',
                      borderRadius: 8,
                      border: '1px solid var(--color-border)'
                    }}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <label style={{ display: 'block', marginTop: 12, fontWeight: 600 }}>Assigned To</label>
                  <select
                    value={editAssigned}
                    onChange={(e) => setEditAssigned(e.target.value)}
                    style={{
                      width: '100%',
                      marginTop: 6,
                      padding: '10px',
                      borderRadius: 8,
                      border: '1px solid var(--color-border)'
                    }}
                  >
                    {ASSIGNEES.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                  <p style={{ marginTop: 14 }}>
                    <strong>Student Report:</strong>
                  </p>
                  <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#444', lineHeight: 1.5, margin: 0, fontFamily: 'inherit' }}>
                    {getStudentReportDetails(selected.raw || selected)}
                  </pre>
                  <p style={{ marginTop: 14 }}>
                    <strong>Date Reported:</strong> {selected.date}
                  </p>
                  <div style={{ display: 'flex', gap: 10, marginTop: '1.25rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={handleSave}
                      style={{
                        padding: '10px 20px',
                        border: 'none',
                        borderRadius: 8,
                        background: 'var(--color-primary)',
                        color: '#fff',
                        fontWeight: 600
                      }}
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      style={{
                        padding: '10px 20px',
                        border: '1px solid var(--color-border)',
                        borderRadius: 8,
                        background: '#f3f4f6',
                        fontWeight: 600
                      }}
                      onClick={() => alert(JSON.stringify(selected.raw?.chat || [], null, 2))}
                    >
                      View Full Report
                    </button>
                  </div>
                  {saveMsg && <p style={{ marginTop: 10, color: '#16a34a' }}>{saveMsg}</p>}
                </div>
              )}
            </section>
          </div>
        </div>
      </PageShell>
    </>
  );
}
