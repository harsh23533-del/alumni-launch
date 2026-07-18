import { useEffect, useState } from 'react';
import api from '../../api/client';

const TABS = ['Overview', 'Students', 'Alumni', 'Companies', 'Startups', 'Jobs', 'Applications'];

export default function AdminDashboard() {
  const [tab, setTab] = useState('Overview');
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState(null);
  const [alumni, setAlumni] = useState(null);
  const [companies, setCompanies] = useState(null);
  const [startups, setStartups] = useState(null);
  const [jobs, setJobs] = useState(null);
  const [applications, setApplications] = useState(null);
  const [jobApplications, setJobApplications] = useState(null);
  const [error, setError] = useState('');
  const [actioning, setActioning] = useState(null);

  useEffect(() => {
    api.get('/admin/dashboard').then((res) => setStats(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setError('');
    const load = async () => {
      try {
        if (tab === 'Students' && !students) {
          const res = await api.get('/admin/students');
          setStudents(res.data);
        } else if (tab === 'Alumni' && !alumni) {
          const res = await api.get('/admin/alumni');
          setAlumni(res.data);
        } else if (tab === 'Companies' && !companies) {
          const res = await api.get('/admin/companies');
          setCompanies(res.data);
        } else if (tab === 'Startups' && !startups) {
          const res = await api.get('/admin/startups');
          setStartups(res.data);
        } else if (tab === 'Jobs' && !jobs) {
          const res = await api.get('/admin/jobs');
          setJobs(res.data);
        } else if (tab === 'Applications' && !applications) {
          const [a, j] = await Promise.all([
            api.get('/admin/applications'),
            api.get('/admin/job-applications'),
          ]);
          setApplications(a.data);
          setJobApplications(j.data);
        }
      } catch (err) {
        setError(err.response?.data?.detail || 'Could not load data.');
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const actOnStudent = async (studentId, action) => {
    setActioning(studentId);
    try {
      await api.post(`/admin/students/${studentId}/${action}`);
      setStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, approval_status: action === 'approve' ? 'approved' : 'rejected' } : s))
      );
      setStats((prev) => (prev ? { ...prev, pending_students: Math.max(0, prev.pending_students - 1) } : prev));
    } catch (err) {
      setError(err.response?.data?.detail || `Could not ${action} this student.`);
    } finally {
      setActioning(null);
    }
  };

  return (
    <div className="page" style={{ paddingTop: 32, maxWidth: 960 }}>
      <h2 style={{ fontSize: 26, marginBottom: 6 }}>Admin dashboard</h2>
      <p style={{ color: 'var(--text-dim)', fontSize: 14.5, marginBottom: 20 }}>
        Everything happening on the platform, in one place.
      </p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {TABS.map((t) => (
          <button
            key={t}
            className={t === tab ? 'btn btn-brass' : 'btn btn-ghost'}
            onClick={() => setTab(t)}
            style={{ padding: '6px 14px', fontSize: 13.5 }}
          >
            {t}
          </button>
        ))}
      </div>

      {error && <div className="error-banner">{error}</div>}

      {tab === 'Overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          {!stats && <p style={{ color: 'var(--text-dim)' }}>Loading…</p>}
          {stats && (
            <>
              <StatCard label="Students" value={stats.total_students} sub={`${stats.pending_students} pending`} />
              <StatCard label="Alumni" value={stats.total_alumni} sub={`${stats.claimed_alumni} claimed`} />
              <StatCard label="Companies" value={stats.total_companies} />
              <StatCard label="Startups" value={stats.total_startups} />
              <StatCard label="Jobs posted" value={stats.total_jobs} />
              <StatCard label="Startup applications" value={stats.total_startup_applications} />
              <StatCard label="Job applications" value={stats.total_job_applications} />
            </>
          )}
        </div>
      )}

      {tab === 'Students' && (
        <List loading={!students} empty={students && students.length === 0} emptyText="No students yet.">
          {students?.map((s) => (
            <div key={s.id} className="card" style={rowStyle}>
              <div>
                <h3 style={{ fontSize: 16 }}>{s.name}</h3>
                <div style={metaStyle}>
                  {s.email} {s.branch ? `· ${s.branch}` : ''} {s.year ? `· ${s.year}` : ''} · {s.approval_status}
                </div>
              </div>
              {s.approval_status === 'pending' && (
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-brass" disabled={actioning === s.id} onClick={() => actOnStudent(s.id, 'approve')}>Approve</button>
                  <button className="btn btn-danger" disabled={actioning === s.id} onClick={() => actOnStudent(s.id, 'reject')}>Reject</button>
                </div>
              )}
            </div>
          ))}
        </List>
      )}

      {tab === 'Alumni' && (
        <List loading={!alumni} empty={alumni && alumni.length === 0} emptyText="No alumni yet.">
          {alumni?.map((a) => (
            <div key={a.id} className="card" style={rowStyle}>
              <div>
                <h3 style={{ fontSize: 16 }}>{a.name || 'Unnamed'}</h3>
                <div style={metaStyle}>
                  {a.email} {a.company ? `· ${a.company}` : ''} {a.batch ? `· Batch ${a.batch}` : ''} · {a.is_claimed ? 'claimed' : 'imported, unclaimed'}
                </div>
              </div>
            </div>
          ))}
        </List>
      )}

      {tab === 'Companies' && (
        <List loading={!companies} empty={companies && companies.length === 0} emptyText="No companies yet.">
          {companies?.map((c) => (
            <div key={c.id} className="card" style={rowStyle}>
              <div>
                <h3 style={{ fontSize: 16 }}>{c.company_name}</h3>
                <div style={metaStyle}>{c.industry || 'Industry not set'} {c.website ? `· ${c.website}` : ''}</div>
              </div>
            </div>
          ))}
        </List>
      )}

      {tab === 'Startups' && (
        <List loading={!startups} empty={startups && startups.length === 0} emptyText="No startups posted yet.">
          {startups?.map((s) => (
            <div key={s.id} className="card" style={rowStyle}>
              <div>
                <h3 style={{ fontSize: 16 }}>{s.title}</h3>
                <div style={metaStyle}>{s.domain || 'Domain not set'} · {s.stage || 'Stage not set'} · {s.is_active ? 'active' : 'inactive'}</div>
              </div>
            </div>
          ))}
        </List>
      )}

      {tab === 'Jobs' && (
        <List loading={!jobs} empty={jobs && jobs.length === 0} emptyText="No jobs posted yet.">
          {jobs?.map((j) => (
            <div key={j.id} className="card" style={rowStyle}>
              <div>
                <h3 style={{ fontSize: 16 }}>{j.title}</h3>
                <div style={metaStyle}>
                  {j.job_type} · {j.location || 'Location not set'} · posted by {j.posted_by_name || 'unknown'} ({j.posted_by_type}) · {j.is_active ? 'active' : 'inactive'}
                </div>
              </div>
            </div>
          ))}
        </List>
      )}

      {tab === 'Applications' && (
        <>
          <h3 style={{ fontSize: 16, margin: '4px 0 10px' }}>Startup applications</h3>
          <List loading={!applications} empty={applications && applications.length === 0} emptyText="None yet.">
            {applications?.map((a) => (
              <div key={a.id} className="card" style={rowStyle}>
                <div style={metaStyle}>Status: {a.status} · Applied {new Date(a.created_at).toLocaleDateString()}</div>
              </div>
            ))}
          </List>

          <h3 style={{ fontSize: 16, margin: '20px 0 10px' }}>Job applications</h3>
          <List loading={!jobApplications} empty={jobApplications && jobApplications.length === 0} emptyText="None yet.">
            {jobApplications?.map((a) => (
              <div key={a.id} className="card" style={rowStyle}>
                <div style={metaStyle}>Status: {a.status} · Applied {new Date(a.created_at).toLocaleDateString()}</div>
              </div>
            ))}
          </List>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: 18 }}>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function List({ loading, empty, emptyText, children }) {
  if (loading) return <p style={{ color: 'var(--text-dim)' }}>Loading…</p>;
  if (empty) return <div className="card" style={{ textAlign: 'center', color: 'var(--text-dim)' }}>{emptyText}</div>;
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>;
}

const rowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' };
const metaStyle = { fontSize: 13.5, color: 'var(--text-dim)', marginTop: 4 };
