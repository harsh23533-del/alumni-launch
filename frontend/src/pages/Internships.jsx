import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import JobCard from '../components/JobCard';
import usePageTitle from '../hooks/usePageTitle';

function SignInLock({ onClose }) {
  const navigate = useNavigate();
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 380, padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 30, marginBottom: 10 }}>🔒</div>
        <h3 style={{ fontSize: 16.5, marginBottom: 8 }}>First sign in</h3>
        <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 18 }}>
          Sign in first — then you can view the internships posted.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn btn-brass" onClick={() => navigate('/login')}>Log in</button>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function TeaserCard({ title, meta, isAuthenticated, onClick }) {
  return (
    <div
      onClick={onClick}
      className="card"
      style={{ padding: 16, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}
    >
      <div>
        <h3 style={{ fontSize: 15.5, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 17 }}>🎓</span> {title}
        </h3>
        <div style={{ fontSize: 12.5, color: 'var(--text-dim)', marginTop: 3 }}>{meta}</div>
      </div>
      <span style={{ fontSize: 12.5, color: 'var(--brass)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
        🔒 {isAuthenticated ? 'View details' : 'Sign in to view'}
      </span>
    </div>
  );
}

export default function Internships() {
  usePageTitle('Internships', 'Internships posted by alumni and companies. Sign in to view details and apply.');
  const { isAuthenticated, role } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLock, setShowLock] = useState(false);
  const [openJob, setOpenJob] = useState(null);
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

  const handleClick = (job) => {
    if (!isAuthenticated) return setShowLock(true);
    setOpenJob(job);
  };

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
      setOpenJob(null);
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

      <div style={{ display: 'grid', gap: 12 }}>
        {jobs.map((j) => (
          <TeaserCard
            key={j.id}
            title={j.title}
            meta={j.location ? `📍 ${j.location}` : ''}
            isAuthenticated={isAuthenticated}
            onClick={() => handleClick(j)}
          />
        ))}
      </div>

      {showLock && <SignInLock onClose={() => setShowLock(false)} />}

      {openJob && (
        <div onClick={() => setOpenJob(null)} style={overlayStyle}>
          <div style={{ maxWidth: 460, width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <JobCard
              job={openJob}
              actionSlot={
                role !== 'alumni' && role !== 'company' && (
                  <button
                    className="btn btn-brass"
                    disabled={appliedIds.has(openJob.id)}
                    onClick={() => openApply(openJob)}
                  >
                    {appliedIds.has(openJob.id) ? 'Applied' : 'Apply now'}
                  </button>
                )
              }
            />
            <button className="btn btn-ghost" style={{ marginTop: 10 }} onClick={() => setOpenJob(null)}>Close</button>
          </div>
        </div>
      )}

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
