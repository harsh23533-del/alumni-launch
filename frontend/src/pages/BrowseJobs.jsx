import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import JobCard from '../components/JobCard';
import usePageTitle from '../hooks/usePageTitle';

const ELIGIBILITY_LABELS = {
  '10th_plus': '10th Pass',
  '12th_plus': '12th Pass',
  btech: 'B.Tech',
  after_btech: 'After B.Tech',
};

function SignInLock({ onClose }) {
  const navigate = useNavigate();
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 380, padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 30, marginBottom: 10 }}>🔒</div>
        <h3 style={{ fontSize: 16.5, marginBottom: 8 }}>First sign in</h3>
        <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 18 }}>
          Sign in first — then you can view the jobs posted.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn btn-brass" onClick={() => navigate('/login')}>Log in</button>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function GovtJobDetail({ job, onClose }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460, padding: 24, maxHeight: '80vh', overflowY: 'auto' }}>
        <h3 style={{ fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>🏛️</span> {job.title}
        </h3>
        <div style={{ fontSize: 12.5, color: 'var(--text-dim)', margin: '6px 0 14px' }}>
          {job.location ? `📍 ${job.location} · ` : ''}
          {job.eligibility ? `🎓 Eligibility: ${ELIGIBILITY_LABELS[job.eligibility] || job.eligibility}` : ''}
        </div>
        {job.description && <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 14 }}>{job.description}</p>}
        {job.stipend_or_salary && <div style={{ fontSize: 13, marginBottom: 8 }}>💰 {job.stipend_or_salary}</div>}
        {job.apply_link && (
          <a href={job.apply_link} target="_blank" rel="noreferrer" className="btn btn-brass" style={{ display: 'inline-block', marginTop: 10 }}>
            Apply / Official notification →
          </a>
        )}
        <div style={{ marginTop: 16 }}>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function TeaserCard({ icon, title, meta, isAuthenticated, onClick }) {
  return (
    <div
      onClick={onClick}
      className="card"
      style={{ padding: 16, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}
    >
      <div>
        <h3 style={{ fontSize: 15.5, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 17 }}>{icon}</span> {title}
        </h3>
        <div style={{ fontSize: 12.5, color: 'var(--text-dim)', marginTop: 3 }}>{meta}</div>
      </div>
      <span style={{ fontSize: 12.5, color: 'var(--brass)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
        🔒 {isAuthenticated ? 'View details' : 'Sign in to view'}
      </span>
    </div>
  );
}

export default function BrowseJobs() {
  usePageTitle('Browse Jobs', 'Government and private jobs posted on AlumniLaunch. Sign in to view details and apply.');
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  const [govtJobs, setGovtJobs] = useState(null);
  const [openGovtJob, setOpenGovtJob] = useState(null);

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [openPrivateJob, setOpenPrivateJob] = useState(null);
  const [applyingTo, setApplyingTo] = useState(null);
  const [message, setMessage] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [applySuccess, setApplySuccess] = useState('');
  const [applyError, setApplyError] = useState('');
  const [showLock, setShowLock] = useState(false);

  useEffect(() => {
    api.get('/jobs/government').then((res) => setGovtJobs(res.data)).catch(() => setGovtJobs([]));
  }, []);

  const load = async () => {
    setLoading(true);
    const res = await api.get('/jobs', { params: typeFilter ? { job_type: typeFilter } : {} });
    setJobs(res.data.filter((j) => j.job_type !== 'internship'));
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

  const handleGovtClick = async (job) => {
    if (!isAuthenticated) return setShowLock(true);
    try {
      const res = await api.get(`/jobs/government/${job.id}`);
      setOpenGovtJob(res.data);
    } catch {
      setShowLock(true);
    }
  };

  const handlePrivateClick = (job) => {
    if (!isAuthenticated) return setShowLock(true);
    setOpenPrivateJob(job);
  };

  return (
    <div className="page" style={{ paddingTop: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 24 }}>💼</span> Jobs
        </h2>
        <Link to="/internships" className="btn btn-ghost" style={{ fontSize: 12.5, padding: '7px 14px' }}>
          🎓 Looking for internships? →
        </Link>
      </div>

      {applySuccess && <div className="success-banner">{applySuccess}</div>}

      {govtJobs && govtJobs.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, color: 'var(--brass)', marginBottom: 10 }}>🏛️ Government jobs</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            {govtJobs.map((job) => (
              <TeaserCard
                key={job.id}
                icon="🏛️"
                title={job.title}
                meta={[job.location && `📍 ${job.location}`, job.eligibility && `🎓 ${ELIGIBILITY_LABELS[job.eligibility] || job.eligibility}`].filter(Boolean).join(' · ')}
                isAuthenticated={isAuthenticated}
                onClick={() => handleGovtClick(job)}
              />
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
        <h3 style={{ fontSize: 15, color: 'var(--text-dim)' }}>Private jobs</h3>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid var(--line)', minWidth: 160 }}
        >
          <option value="">All types</option>
          <option value="full_time">Full-time</option>
          <option value="part_time">Part-time</option>
        </select>
      </div>

      {loading && <p style={{ color: 'var(--text-dim)' }}>Loading jobs…</p>}
      {!loading && jobs.length === 0 && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-dim)' }}>
          No open roles match that filter yet. Check back soon.
        </div>
      )}

      <div style={{ display: 'grid', gap: 12 }}>
        {jobs.map((j) => (
          <TeaserCard
            key={j.id}
            icon="💼"
            title={j.title}
            meta={[j.location && `📍 ${j.location}`, j.job_type === 'full_time' ? 'Full-time' : 'Part-time'].filter(Boolean).join(' · ')}
            isAuthenticated={isAuthenticated}
            onClick={() => handlePrivateClick(j)}
          />
        ))}
      </div>

      {showLock && <SignInLock onClose={() => setShowLock(false)} />}
      {openGovtJob && <GovtJobDetail job={openGovtJob} onClose={() => setOpenGovtJob(null)} />}

      {openPrivateJob && (
        <div onClick={() => setOpenPrivateJob(null)} style={overlayStyle}>
          <div style={{ maxWidth: 460, width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <JobCard
              job={openPrivateJob}
              actionSlot={
                role !== 'alumni' && role !== 'company' && (
                  <button
                    className="btn btn-brass"
                    disabled={appliedIds.has(openPrivateJob.id)}
                    onClick={() => openApply(openPrivateJob)}
                  >
                    {appliedIds.has(openPrivateJob.id) ? 'Applied' : 'Apply now'}
                  </button>
                )
              }
            />
            <button className="btn btn-ghost" style={{ marginTop: 10 }} onClick={() => setOpenPrivateJob(null)}>Close</button>
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
