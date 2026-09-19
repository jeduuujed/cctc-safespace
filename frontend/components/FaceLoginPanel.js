import { useEffect, useRef, useState } from 'react';
import { API_BASE } from '../lib/api';
import { fetchWithAuth } from '../lib/userProfile';

function stopStream(videoEl) {
  const stream = videoEl?.srcObject;
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    videoEl.srcObject = null;
  }
}

export default function FaceLoginPanel({ mode, user, email, onAuthenticated }) {
  const [configured, setConfigured] = useState(null);
  const [enabled, setEnabled] = useState(false);
  const [consent, setConsent] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    return () => stopStream(videoRef.current);
  }, []);

  useEffect(() => {
    if (mode !== 'settings' || !user) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const token = await user.getIdToken();
        const data = await fetchWithAuth('/api/face-auth/status', token);
        if (!cancelled) {
          setConfigured(data.configured);
          setEnabled(!!data.enabled);
          setMessage(data.message || '');
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not load face login status');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, user]);

  const startCamera = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
    } catch {
      setError('Camera access denied or unavailable. Check browser permissions and try again.');
    }
  };

  const cancelCamera = () => {
    stopStream(videoRef.current);
    setCameraOn(false);
  };

  const captureFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) {
      throw new Error('Camera is not ready yet. Wait a moment and try again.');
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.85);
  };

  const enroll = async () => {
    if (!consent) {
      setError('Please confirm consent before enrolling face login.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const imageBase64 = captureFrame();
      const token = await user.getIdToken();
      const data = await fetchWithAuth('/api/face-auth/enroll', token, {
        method: 'POST',
        body: JSON.stringify({ imageBase64, consent: true })
      });
      setEnabled(true);
      setConfigured(true);
      setMessage(data.message || 'Face login enrolled.');
      cancelCamera();
    } catch (err) {
      setError(err.message || 'Enrollment failed');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    setError('');
    try {
      const token = await user.getIdToken();
      await fetchWithAuth('/api/face-auth/enroll', token, { method: 'DELETE' });
      setEnabled(false);
      setMessage('Face login disabled for this account.');
      cancelCamera();
    } catch (err) {
      setError(err.message || 'Could not remove face login');
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    if (!email) {
      setError('Enter the email for your account before using face login.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const imageBase64 = captureFrame();
      const res = await fetch(`${API_BASE}/api/face-auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, imageBase64 })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Face verification failed');
      if (!data.customToken) {
        throw new Error('Face login is not fully configured on the server.');
      }
      await onAuthenticated(data.customToken);
      cancelCamera();
    } catch (err) {
      setError(err.message || 'Face login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="face-panel">
      <h3 style={{ margin: '0 0 8px' }}>{mode === 'login' ? 'Login with Face' : 'Face Login Settings'}</h3>
      <p style={{ margin: 0, fontSize: 13, color: '#444', lineHeight: 1.5 }}>
        Face login is optional. After you enroll, the server verifies a live camera capture against your enrolled
        biometric template through Azure Face (when configured) and then signs you in with a Firebase custom token.
        Raw photos are not stored in Firestore. Password login remains available.
      </p>
      {mode === 'settings' && (
        <p style={{ fontSize: 13, color: '#555' }}>
          Status: {enabled ? 'Enabled' : 'Disabled'}
          {configured === false ? ' · Azure Face is not configured on the server yet.' : ''}
        </p>
      )}
      <ol style={{ fontSize: 13, color: '#444', paddingLeft: 18 }}>
        <li>Allow camera access when your browser asks.</li>
        <li>Face the camera in good lighting, with your full face visible.</li>
        <li>Keep a neutral expression and look at the camera.</li>
      </ol>
      {mode === 'settings' && (
        <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, marginBottom: 10 }}>
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>
            I consent to using a facial template for optional login. I understand this is stored with the biometric
            provider, not as a public photo, and I can remove it at any time.
          </span>
        </label>
      )}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {!cameraOn ? (
          <button type="button" onClick={startCamera}>
            {mode === 'login' ? 'Open camera' : 'Set up camera'}
          </button>
        ) : (
          <button type="button" onClick={cancelCamera}>
            Cancel camera
          </button>
        )}
        {mode === 'settings' && (
          <>
            <button type="button" onClick={enroll} disabled={!cameraOn || busy}>
              {busy ? 'Working…' : 'Capture and enroll'}
            </button>
            <button type="button" onClick={remove} disabled={busy || !enabled}>
              Disable face login
            </button>
          </>
        )}
        {mode === 'login' && (
          <button type="button" onClick={verify} disabled={!cameraOn || busy}>
            {busy ? 'Verifying…' : 'Verify and sign in'}
          </button>
        )}
      </div>
      {cameraOn && (
        <video ref={videoRef} playsInline muted style={{ width: '100%', maxWidth: 320, marginTop: 12, borderRadius: 8, background: '#000' }} />
      )}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {message && <p style={{ fontSize: 13, color: '#166534' }}>{message}</p>}
      {error && <p style={{ fontSize: 13, color: '#b91c1c' }}>{error}</p>}
    </div>
  );
}
