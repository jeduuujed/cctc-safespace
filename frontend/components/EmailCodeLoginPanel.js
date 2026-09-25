import { useState } from 'react';
import { API_BASE } from '../lib/api';

export default function EmailCodeLoginPanel({ email, onAuthenticated }) {
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const requestCode = async () => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch(`${API_BASE}/api/auth/request-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not send the authentication code.');
      setSent(true);
      setMessage(data.message);
    } catch (err) {
      setError(err.message || 'Could not send the authentication code.');
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/api/auth/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Invalid authentication code.');
      await onAuthenticated(data.customToken);
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ marginTop: 12, textAlign: 'left' }}>
      <p style={{ margin: '0 0 10px', fontSize: 13, color: '#444', lineHeight: 1.5 }}>
        Receive a one-time authentication code in your Gmail inbox. The code expires after 10 minutes.
      </p>
      {!sent ? (
        <button type="button" onClick={requestCode} disabled={busy || !email} style={{ width: '100%' }}>
          {busy ? 'Sending...' : 'Send Gmail Code'}
        </button>
      ) : (
        <form onSubmit={verifyCode}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 5 }}>
            Authentication code
          </label>
          <input
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
            required
            style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-input)', border: '1px solid var(--color-border)', marginBottom: 8 }}
          />
          <button type="submit" disabled={busy || code.length !== 6} style={{ width: '100%' }}>
            {busy ? 'Verifying...' : 'Verify Code and Sign In'}
          </button>
          <button type="button" onClick={requestCode} disabled={busy} style={{ width: '100%', marginTop: 8 }}>
            Send a new code
          </button>
        </form>
      )}
      {message && <p style={{ fontSize: 13, color: '#166534' }}>{message}</p>}
      {error && <p style={{ fontSize: 13, color: '#b91c1c' }}>{error}</p>}
    </div>
  );
}