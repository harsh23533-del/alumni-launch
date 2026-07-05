import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import StartupCard from '../components/StartupCard';

export default function BrowseStartups() {
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [domainFilter, setDomainFilter] = useState('');
  const [applyingTo, setApplyingTo] = useState(null); // startup object or null
  const [message, setMessage] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [applySuccess, setApplySuccess] = useState('');
  const [applyError, setApplyError] = useState('');

  const load = async () => {
    setLoading(true);
    const res = await api.get('/startups', { params: domainFilter ? { domain: domainFilter } : {} });
    setStartups(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [domainFilter]);

  const openApply = (startup) => {
    setApplyError('');
    setApplySuccess('');
    setMessage('I will join if accepted!');
    setResumeFile(null);
    setApplyingTo(startup);
  };

  const submitApplication = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setApplyError('');
    try {
      const formData = new FormData();
      formData.append('startup_id', applyingTo.id);
      formData.append('message', message);
      if (resumeFile) formData.append('resume', resumeFile);

      await api.post('/applications', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setApplySuccess('Application sent! The founder will review it soon.');
      setApplyingTo(null);
    } catch (err) {
      setApplyError(err.response?.data?.detail || 'Could not submit your application.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page" style={{ paddingTop: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <h2 style={{ fontSize: 26 }}>Open startups</h2>
        <input
          placeholder="Filter by domain (e.g. Fintech)"
          value={domainFilter}
          onChange={(e) => setDomainFilter(e.target.value)}
          style={{ padding: '9px 13px', borderRadius: 8, border: '1.5px solid var(--line)', minWidth: 220 }}
        />
      </div>

      {applySuccess && <div className="success-banner">{applySuccess}</div>}

      {loading && <p style={{ color: 'var(--text-dim)' }}>Loading startups…</p>}
      {!loading && startups.length === 0 && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-dim)' }}>
          No open startups match that filter yet. Check back soon.
        </div>
      )}

      {startups.map((s) => (
        <StartupCard
          key={s.id}
          startup={s}
          actionSlot={
            role !== 'alumni' && (
              <button
                className="btn btn-brass"
                onClick={() => {
                  if (!isAuthenticated) return navigate('/signup/student');
                  openApply(s);
                }}
              >
                {isAuthenticated ? 'Apply with resume' : 'Sign up to apply'}
              </button>
            )
          }
        />
      ))}

      {applyingTo && (
        <div style={overlayStyle} onClick={() => setApplyingTo(null)}>
          <div className="card" style={{ maxWidth: 440, width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 20, marginBottom: 4 }}>Apply to {applyingTo.title}</h3>
            <p style={{ color: 'var(--text-dim)', fontSize: 13.5, marginBottom: 18 }}>
              Your resume and message go straight to the founder.
            </p>

            {applyError && <div className="error-banner">{applyError}</div>}

            <form onSubmit={submitApplication}>
              <div className="field">
                <label htmlFor="message">Message to the founder</label>
                <textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="resume">Resume (PDF)</label>
                <input id="resume" type="file" accept=".pdf,.doc,.docx" onChange={(e) => setResumeFile(e.target.files[0])} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setApplyingTo(null)}>Cancel</button>
                <button type="submit" className="btn btn-brass" disabled={submitting} style={{ flex: 1 }}>
                  {submitting ? 'Sending…' : 'Send application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const overlayStyle = {
  position: 'fixed', inset: 0, background: 'rgba(22,33,62,0.45)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 50,
};
