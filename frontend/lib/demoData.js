/** Demo rows for student + admin UI when aligning to mockups */
export const DEMO_CASES = [
  {
    id: 'R001',
    category: 'Cyberbullying',
    submitted: '2026-01-20',
    priority: 'high',
    status: 'review',
    assigned: 'Ms. Santos',
    description: 'Repeated harassment through social media with threatening messages.',
    timeline: [
      { t: '2026-01-20 14:30', text: 'Report submitted successfully', done: true },
      { t: '2026-01-20 15:00', text: 'Case assigned to Ms. Santos', done: false },
      { t: '2026-01-21 10:00', text: 'Initial review completed. Investigation ongoing.', done: false }
    ]
  },
  {
    id: 'R002',
    category: 'Verbal Harassment',
    submitted: '2026-01-15',
    priority: 'medium',
    status: 'resolved',
    assigned: 'Mr. Reyes',
    description: 'Incident in classroom setting.',
    timeline: [
      { t: '2026-01-15 09:00', text: 'Report submitted successfully', done: true },
      { t: '2026-01-16 11:00', text: 'Case resolved after mediation.', done: true }
    ]
  }
];

export const DEMO_UPDATES = [
  {
    icon: 'bell',
    title: 'Your report #R001 is now under review',
    sub: 'A counselor has been assigned to your case',
    time: '2 hours ago'
  },
  {
    icon: 'doc',
    title: 'Report #R002 has been resolved',
    sub: 'Thank you for bringing this to our attention',
    time: '1 day ago'
  }
];

export const DEMO_ADMIN_REPORTS = [
  {
    id: 'demo-r001',
    code: 'R001',
    anonymous: true,
    priority: 'High',
    type: 'Cyberbullying',
    student: 'Anonymous',
    date: '2026-01-20',
    status: 'Under Review',
    assigned: 'Ms. Santos',
    description: 'Repeated harassment through social media with threatening messages.',
    severity: 'High'
  },
  {
    id: 'demo-r002',
    code: 'R002',
    anonymous: false,
    priority: 'Medium',
    type: 'Verbal Harassment',
    student: 'Maria Garcia',
    date: '2026-01-20',
    status: 'Received',
    assigned: 'Unassigned',
    description: 'Verbal harassment during group work.',
    severity: 'Medium'
  },
  {
    id: 'demo-r003',
    code: 'R003',
    anonymous: true,
    priority: 'Critical',
    type: 'Physical Bullying',
    student: 'Anonymous',
    date: '2026-01-19',
    status: 'Resolved',
    assigned: 'Mr. Reyes',
    description: 'Physical altercation on campus grounds.',
    severity: 'Critical'
  },
  {
    id: 'demo-r004',
    code: 'R004',
    anonymous: false,
    priority: 'Medium',
    type: 'Discrimination',
    student: 'John Cruz',
    date: '2026-01-18',
    status: 'Under Review',
    assigned: 'Ms. Santos',
    description: 'Discriminatory remarks reported in hallway.',
    severity: 'Medium'
  },
  {
    id: 'demo-r005',
    code: 'R005',
    anonymous: true,
    priority: 'High',
    type: 'Cyberbullying',
    student: 'Anonymous',
    date: '2026-01-17',
    status: 'Received',
    assigned: 'Mr. Reyes',
    description: 'Online messages targeting a student.',
    severity: 'High'
  }
];

export function mapFirestoreReport(doc) {
  const d = doc.data();
  const created = d.createdAt?.toDate ? d.createdAt.toDate() : new Date();
  const y = created.getFullYear();
  const m = String(created.getMonth() + 1).padStart(2, '0');
  const day = String(created.getDate()).padStart(2, '0');
  return {
    id: doc.id,
    code: doc.id.slice(0, 6).toUpperCase(),
    anonymous: !!d.anonymous,
    priority: d.priority || 'Medium',
    type: d.category || 'Incident',
    student: d.anonymous ? 'Anonymous' : d.reporterName || 'Student',
    date: `${y}-${m}-${day}`,
    status: d.status || 'Pending',
    assigned: d.assignedTo || 'Unassigned',
    description: d.summary || (d.chat ? String(d.chat).slice(0, 200) : 'No description.'),
    severity: d.priority || 'Medium',
    raw: d
  };
}
