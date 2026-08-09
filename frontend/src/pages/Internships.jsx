import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import JobCard from '../components/JobCard';
import usePageTitle from '../hooks/usePageTitle';

export default function Internships() {
  usePageTitle('Internships', 'Browse internships posted by alumni and companies. Apply directly with your resume.');
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyingTo, setApplyingTo] = useState(null);
  const [message, setMessage] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [applySuccess, setApplySuccess] = useState('');
  const [applyError, setApplyError] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get('/jobs', { params: { job_type: 'internship' } }).then((res) => setJobs(res.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!isAuthenticated || role !== 'student') return;
    api.get('/jobs/applications/mine').then((res) => setAppliedIds(new Set(res.data.map((a) => a.job_id))));
  }, [isAuthenticated, role]);

  const openApply = (job) => {
    setApplyError('');
    setApplySuccess('');
    setMessage('I would love to be considered for this role!');
    setResumeFile(null);
    setApplyingTo(job);
  };

  const submitApplication = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setApplyError('');
    try {
      const formData = new FormData();
      formData.append('job_id', applyingTo.id);
      formData.append('message', message);
      if (resumeFile) formData.append('resume', resumeFile);
      await api.post('/jobs/apply', formData);
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
      <h2 style={{ fontSize: 20, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <span style={{ fontSize: 24 }}>🎓</span> Internships
      </h2>

      {applySuccess && <div className="success-banner">{applySuccess}</div>}

      {loading && <p style={{ color: 'var(--text-dim)' }}>Loading internships…</p>}
      {!loading && jobs.length === 0 && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-dim)' }}>
          No open internships yet. Check back soon.
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
              <div className="field">
                <label htmlFor="resume">Resume (optional)</label>
                <input
                  id="resume"
                  type="file"
                  onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                  style={{ padding: '9px 0', border: 'none' }}
                />
                <p style={{ color: 'var(--text-dim)', fontSize: 12.5, marginTop: 4 }}>
                  {resumeFile
                    ? `Selected: ${resumeFile.name}`
                    : 'PDF, screenshot, photo — whatever you have works. Leave blank to use the resume on your profile.'}
                </p>
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
