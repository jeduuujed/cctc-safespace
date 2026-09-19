import { useRouter } from 'next/router';
import AppHeader from '../components/AppHeader';
import PageShell from '../components/PageShell';
import { useUserProfile } from '../hooks/useUserProfile';
import MessagingInterface from '../components/MessagingInterface';
import { getDashboardPath } from '../lib/roles';

export default function MessagesPage() {
  const router = useRouter();
  const { user, profile, loading } = useUserProfile();
  const defaultType = typeof router.query.type === 'string' ? router.query.type : '';

  if (loading) {
    return (
      <>
        <AppHeader variant="student" />
        <PageShell>
          <p>Loading...</p>
        </PageShell>
      </>
    );
  }

  if (!user || !profile) {
    return (
      <>
        <AppHeader variant="auth" />
        <PageShell>
          <p>Please sign in to access messages.</p>
        </PageShell>
      </>
    );
  }

  const variant = profile.role === 'teacher' ? 'teacher' : profile.role === 'counselor' ? 'counselor' : 'student';

  return (
    <>
      <AppHeader
        variant={variant}
        userLine="Messages"
        backHref={getDashboardPath(profile.role, profile.email)}
        backLabel="Back to Dashboard"
      />
      <PageShell>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h1 style={{ margin: '0 0 1rem', fontSize: '1.4rem' }}>Private Messages</h1>
          <p style={{ marginTop: 0, color: '#555', fontSize: 14 }}>
            Direct messages stay between you and authorized staff. The AI assistant used for incident reporting is
            separate from this inbox.
          </p>
          <MessagingInterface user={user} profile={profile} defaultType={defaultType} />
        </div>
      </PageShell>
    </>
  );
}
