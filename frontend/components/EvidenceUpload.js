import { useRef, useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export default function EvidenceUpload({ onUploadComplete, compact }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [urls, setUrls] = useState([]);
  const [message, setMessage] = useState('');

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const invalidFiles = files.filter((file) => !ALLOWED_TYPES.includes(file.type) || file.size > MAX_FILE_SIZE);
    if (invalidFiles.length > 0) {
      setMessage('Only image files up to 5 MB are supported.');
      e.target.value = '';
      return;
    }

    setUploading(true);
    setMessage('');
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const fileRefPath = ref(storage, `evidence/${Date.now()}-${file.name}`);
        await uploadBytes(fileRefPath, file);
        const url = await getDownloadURL(fileRefPath);
        uploadedUrls.push(url);
      }
      const allUrls = [...urls, ...uploadedUrls];
      setUrls(allUrls);
      onUploadComplete?.(allUrls);
      setMessage(`${uploadedUrls.length} file(s) uploaded successfully.`);
    } catch (err) {
      console.error('Failed to upload evidence:', err);
      setMessage('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  if (compact) {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <input ref={fileRef} type="file" multiple hidden onChange={handleFileChange} />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 14px',
            borderRadius: 'var(--radius-input)',
            border: '1px solid var(--color-border)',
            background: 'var(--color-gray-bg)',
            fontSize: 13,
            color: '#333'
          }}
        >
          <span aria-hidden>📎</span> {uploading ? 'Uploading...' : 'Upload Evidence'}
        </button>
        {urls.length > 0 && (
          <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>
            {urls.length} file(s) attached
          </span>
        )}
        {message && <span style={{ fontSize: 12, color: '#444' }}>{message}</span>}
      </div>
    );
  }

  return (
    <div style={{ border: '1px dashed #ccc', padding: '1rem', borderRadius: 8 }}>
      <p style={{ fontSize: 14, marginTop: 0 }}>
        Optional: upload screenshots or photos. Only image files up to 5 MB are supported.
      </p>
      <input type="file" multiple onChange={handleFileChange} />
      {uploading && <p>Uploading...</p>}
      {message && <p style={{ fontSize: 13, color: '#444' }}>{message}</p>}
      {urls.length > 0 && (
        <ul style={{ marginTop: '0.5rem', fontSize: 14 }}>
          {urls.map((u) => (
            <li key={u}>
              <a href={u} target="_blank" rel="noreferrer">
                Evidence file
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
