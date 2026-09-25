import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import ChatBot from '../components/ChatBot';
import EvidenceUpload from '../components/EvidenceUpload';
import AppHeader from '../components/AppHeader';
import PageShell from '../components/PageShell';
import { useAuthUser } from '../hooks/useStudentAuth';
import { API_BASE } from '../lib/api';

export default function Report() {
  const router = useRouter();
  const user = useAuthUser();
  const [messages, setMessages] = useState([]);
  const [evidenceURLs, setEvidenceURLs] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState({ type: '', message: '' });
  const [anonymous, setAnonymous] = useState(true);
  const [reviewOpen, setReviewOpen] = useState(false);

  useEffect(() => {
    if (user === null && router.isReady) {
      router.replace(`/login?next=${encodeURIComponent('/report')}`);
    }
  }, [user, router]);

  const handleChatChange = useCallback((nextMessages) => {
    setMessages(nextMessages);
  }, []);

  const hasConversation = messages.some((entry) => entry?.role === 'user') || evidenceURLs.length > 0;

  const handleSubmitReport = async () => {
    if (!hasConversation) {
      setSubmitFeedback({ type: 'error', message: 'Please chat with the assistant first or attach evidence before submitting.' });
      return;
    }

    setSubmitting(true);
    setSubmitFeedback({ type: '', message: '' });

    try {
      const res = await fetch(`${API_BASE}/api/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          evidenceURLs,
          anonymous,
          reporterName: user?.displayName || '',
          reporterEmail: user?.email || '',
          reporterUid: user?.uid || ''
        })
      });

      const data = await res.json();
      if (data.success) {
        setSubmitFeedback({
          type: 'success',
          message: `✅ Your report has been submitted successfully. Reference ID: ${data.reportId || 'created'}`
        });
        setReviewOpen(false);
        setMessages([]);
        setEvidenceURLs([]);
      } else {
        setSubmitFeedback({ type: 'error', message: data.error || 'Something went wrong submitting your report.' });
      }
    } catch (err) {
      console.error(err);
      setSubmitFeedback({ type: 'error', message: 'Unable to submit report right now.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (user === undefined) {
    return (
      <>
        <AppHeader variant="student" backHref="/dashboard" backLabel="Back to Dashboard" />
        <PageShell style={{ padding: '2rem' }}>
          <p>Loading...</p>
        </PageShell>
      </>
    );
  }

  if (user === null) {
    return null;
  }

  const displayName = user.displayName || user.email?.split('@')[0] || 'student';

  return (
    <>
      <AppHeader
        variant="student"
        userLine={`Logged in as ${displayName}`}
        backHref="/dashboard"
        backLabel="Back to Dashboard"
      />
      <PageShell>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div
            style={{
              background: '#fff',
              borderRadius: 'var(--radius-card)',
              boxShadow: 'var(--shadow-card)',
              padding: '1.75rem 1.5rem 2rem'
            }}
          >
            <h1 style={{ margin: '0 0 0.35rem', fontSize: '1.5rem' }}>Report an Incident</h1>
            <p style={{ margin: '0 0 1.25rem', color: '#444', fontSize: 14 }}>
              Share what happened in a calm, guided conversation. You can upload evidence and keep the report anonymous.
            </p>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: 'var(--color-gray-bg)',
                padding: '12px 14px',
                borderRadius: 10,
                marginBottom: '1.25rem',
                fontSize: 14,
                cursor: 'pointer'
              }}
            >
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
              />
              Submit this report anonymously (your identity will be protected)
            </label>

            <ChatBot
              onMessagesChange={handleChatChange}
              beforeInput={<EvidenceUpload compact onUploadComplete={setEvidenceURLs} />}
              initialPrompt="I am your SafeSpace reporting assistant. Please tell me, in your own words, what happened. I will gently ask for one detail at a time — who was involved, when and where it happened, how often, how it made you feel, and any evidence or witnesses. I follow the CCTC Student Code of Conduct and will only use the details you share."
            />

            <div style={{ marginTop: '1.35rem' }}>
              <button
                type="button"
                onClick={() => setReviewOpen((prev) => !prev)}
                style={{
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-input)',
                  border: '1px solid var(--color-border)',
                  background: '#f8fafc',
                  fontWeight: 600,
                  fontSize: 14
                }}
              >
                {reviewOpen ? 'Hide Review' : 'Review Report'}
              </button>
              {reviewOpen && (
                <div
                  style={{
                    marginTop: 12,
                    padding: '0.9rem 1rem',
                    borderRadius: 10,
                    background: '#f8fafc',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>Report preview</div>
                  <div style={{ fontSize: 13, color: '#444', lineHeight: 1.5 }}>
                    {messages.length > 0
                      ? messages.map((m) => `${m.role === 'user' ? 'You' : 'Assistant'}: ${m.text}`).join('\n')
                      : 'No conversation yet.'}
                  </div>
                  <div style={{ marginTop: 8, fontSize: 13 }}>
                    Evidence files attached: {evidenceURLs.length}
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: '1.25rem' }}>
              <button
                type="button"
                onClick={handleSubmitReport}
                disabled={submitting || !hasConversation}
                style={{
                  padding: '12px 24px',
                  borderRadius: 'var(--radius-input)',
                  border: 'none',
                  background: 'var(--color-primary)',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 15
                }}
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
              {submitFeedback.message && (
                <div
                  role="status"
                  aria-live="polite"
                  style={{
                    marginTop: '0.75rem',
                    padding: '0.85rem 1rem',
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 600,
                    border: `1px solid ${submitFeedback.type === 'success' ? '#86efac' : '#fecaca'}`,
                    background: submitFeedback.type === 'success' ? '#ecfdf3' : '#fef2f2',
                    color: submitFeedback.type === 'success' ? '#166534' : '#991b1b'
                  }}
                >
                  {submitFeedback.message}
                </div>
              )}
            </div>
          </div>
        </div>
      </PageShell>
    </>
  );
}
