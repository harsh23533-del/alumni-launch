import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import Seal from '../components/Seal';

const STATUS_OPTIONS = ['pending', 'shortlisted', 'rejected', 'hired'];

export default function JobsDashboard() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedJob, setExpandedJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [appsLoading, setAppsLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await api.get('/jobs/mine');
    setJobs(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleExpand = async (job) => {
    if (expandedJob === job.id) {
      setExpandedJob(null);
      return;
    }
    setExpandedJob(job.id);
    setAppsLoading(true);
    const res = await api.get(`/jobs/${job.id}/applications`);
    setApplications(res.data);
    setAppsLoading(false);
  };

  const closeJob = async (jobId) => {
    await api.patch(`/jobs/${jobId}/close`);
    load();
  };

  const updateStatus = async (applicationId, status) => {
    await api.patch(`/jobs/applications/${applicationId}/status`, { status });
    const job = jobs.find((j) => j.id === expandedJob);
    if (job) {
      const res = await api.get(`/jobs/${job.id}/applications`);
      setApplications(res.data);
    }
  };

  return (
    <div className="page" style={{ paddingTop: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 26 }}>My job postings</h2>
        <button className="btn btn-brass" onClick={() => navigate('/jobs/post')}>Post a new job</button>
      </div>

      {loading && <p style={{ color: 'var(--text-dim)' }}>Loading…</p>}
      {!loading && jobs.length === 0 && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-dim)' }}>
          You haven't posted any jobs yet.
        </div>
      )}

      {jobs.map((job) => (
        <div key={job.id} className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div>
              <h3 style={{ fontSize: 20 }}>{job.title}</h3>
              <div style={{ fontSize: 13.5, color: 'var(--text-dim)', marginTop: 4 }}>
                {job.job_type} {job.location ? `· ${job.location}` : ''}
              </div>
            </div>
            <Seal status={job.is_active ? 'open' : 'closed'} />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button className="btn btn-ghost" onClick={() => toggleExpand(job)}>
              {expandedJob === job.id ? 'Hide applications' : 'View applications'}
            </button>
            {job.is_active && (
              <button className="btn btn-danger" onClick={() => closeJob(job.id)}>Close job</button>
            )}
          </div>

          {expandedJob === job.id && (
            <div style={{ marginTop: 18, borderTop: '1px solid var(--line)', paddingTop: 16 }}>
              {appsLoading && <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Loading applications…</p>}
              {!appsLoading && applications.length === 0 && (
                <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>No applications yet.</p>
              )}
              {!appsLoading && applications.map((app) => (
                <div key={app.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
                  <div>
                    <div style={{ fontSize: 14.5 }}>{app.message || 'No message provided.'}</div>
                    {app.resume_url && (
                      <a href={app.resume_url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: 'var(--brass)', fontWeight: 600 }}>
                        View resume
                      </a>
                    )}
                  </div>
                  <select
                    value={app.status}
                    onChange={(e) => updateStatus(app.id, e.target.value)}
                    style={{ padding: '6px 10px', borderRadius: 8, border: '1.5px solid var(--line)' }}
                  >
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
