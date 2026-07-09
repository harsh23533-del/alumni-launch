import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import JobCard from '../components/JobCard';

export default function BrowseJobs() {
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [applyingTo, setApplyingTo] = useState(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [applySuccess, setApplySuccess] = useState('');
  const [applyError, setApplyError] = useState('');

  const load = async () => {
    setLoading(true);
    const res = await api.get('/jobs', { params: typeFilter ? { job_type: typeFilter } : {} });
    setJobs(res.data);
    setLoading(false);
  };

  const loadMyApplications = async () => {
    if (!isAuthenticated || role !== 'student') return;
    const res = await api.get('/jobs/applications/mine');
    setAppliedIds(new Set(res.data.map((a) => a.job_id)));
  };

  useEffect(() => { load(); }, [typeFilter]);
  useEffect(() => { loadMyApplications(); }, [isAuthenticated, role]);

  const openApply = (job) => {
    setApplyError('');
    setApplySuccess('');
    setMessage('I would love to be considered for this role!');
    setApplyingTo(job);
  };

  const submitApplication = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setApplyError('');
    try {
      await api.post('/jobs/apply', { job_id: applyingTo.id, message });
      setApplySuccess('Application sent! You can track its status from My applications.');
      setAppliedIds((prev) => new Set(prev).add(applyingTo.id));
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
        <h2 style={{ fontSize: 26 }}>Jobs & internships</h2>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{ padding: '9px 13px', borderRadius: 8, border: '1.5px solid var(--line)', minWidth: 200 }}
        >
          <option value="">All types</option>
          <option value="internship">Internship</option>
          <option value="full_time">Full-time</option>
          <option value="part_time">Part-time</option>
        </select>
      </div>

      {applySuccess && <div className="success-banner">{applySuccess}</div>}

      {loading && <p style={{ color: 'var(--text-dim)' }}>Loading jobs…</p>}
      {!loading && jobs.length === 0 && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-dim)' }}>
          No open roles match that filter yet. Check back soon.
        </div>
      )}

      {jobs.map((j) => (
        <JobCard
          key={j.id}
          job={j}
          actionSlot={
            role !== 'alumni' && role !== 'company' && (
              <button
                className="btn btn-brass"
                disabled={appliedIds.has(j.id)}
                onClick={() => {
                  if (!isAuthenticated) return navigate('/signup/student');
                  openApply(j);
                }}
              >
                {!isAuthenticated ? 'Sign up to apply' : appliedIds.has(j.id) ? 'Applied' : 'Apply now'}
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
              Your saved resume and message go straight to the poster.
            </p>

            {applyError && <div className="error-banner">{applyError}</div>}

            <form onSubmit={submitApplication}>
              <div className="field">
                <label htmlFor="message">Message</label>
                <textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} />
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
