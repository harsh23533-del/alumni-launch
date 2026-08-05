import { useState } from 'react';
import api from '../api/client';

function resumeUrl(path) {
  if (!path) return null;
  return path.startsWith('http') ? path : `${api.defaults.baseURL}/${path}`;
}

export default function ResumeCorner({ resumePath, onUploaded }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('resume', file);
      const res = await api.post('/profiles/me/resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFile(null);
      onUploaded?.(res.data.resume_url);
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed. Try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 17, marginBottom: 4 }}>Your resume</h3>
      <p style={{ color: 'var(--text-dim)', fontSize: 13.5, marginBottom: 14 }}>
        Keep one resume on file — used as your default when applying to jobs and startups.
      </p>

      {resumePath && (
        <a
          href={resumeUrl(resumePath)}
          target="_blank"
          rel="noreferrer"
          style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--brass)', textDecoration: 'underline', display: 'inline-block', marginBottom: 12 }}
        >
          View current resume
        </a>
      )}

      {error && <div className="error-banner">{error}</div>}

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <button
          type="button"
          className="btn btn-brass"
          disabled={!file || uploading}
          onClick={handleUpload}
        >
          {uploading ? 'Uploading…' : resumePath ? 'Replace resume' : 'Upload resume'}
        </button>
      </div>
    </div>
  );
}
