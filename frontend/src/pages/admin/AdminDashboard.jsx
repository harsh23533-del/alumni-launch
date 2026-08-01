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

  // kind: 'students' | 'alumni' | 'companies' — matches both the /admin/{kind}
  // URL segment and the setter needed for each list.
  const setterFor = { students: setStudents, alumni: setAlumni, companies: setCompanies };
  const statKeyFor = { students: 'total_students', alumni: 'total_alumni', companies: 'total_companies' };

  const deleteRecord = async (kind, id, label) => {
    const confirmed = window.confirm(
      `Delete this ${label}? This permanently removes all their related data (applications, ` +
      `postings, chat messages, notifications) from the database. This cannot be undone.`
    );
    if (!confirmed) return;

    setActioning(id);
    try {
      await api.delete(`/admin/${kind}/${id}`);
      const setList = setterFor[kind];
      setList((prev) => (prev ? prev.filter((row) => row.id !== id) : prev));
      const statKey = statKeyFor[kind];
      setStats((prev) => (prev ? { ...prev, [statKey]: Math.max(0, prev[statKey] - 1) } : prev));
    } catch (err) {
      setError(err.response?.data?.detail || `Could not delete this ${label}.`);
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
              <div style={{ display: 'flex', gap: 10 }}>
                {s.approval_status === 'pending' && (
                  <>
                    <button className="btn btn-brass" disabled={actioning === s.id} onClick={() => actOnStudent(s.id, 'approve')}>Approve</button>
                    <button className="btn btn-danger" disabled={actioning === s.id} onClick={() => actOnStudent(s.id, 'reject')}>Reject</button>
                  </>
                )}
                <button className="btn btn-danger" disabled={actioning === s.id} onClick={() => deleteRecord('students', s.id, 'student')}>Delete</button>
              </div>
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
              <button className="btn btn-danger" disabled={actioning === a.id} onClick={() => deleteRecord('alumni', a.id, 'alumnus')}>Delete</button>
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
              <button className="btn btn-danger" disabled={actioning === c.id} onClick={() => deleteRecord('companies', c.id, 'company')}>Delete</button>
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
                  {j.job_type} · {j.location || 'Location not set'} · posted by {j.posted_by_name || 'unknown'} ({j.posted_by_type}) ·
