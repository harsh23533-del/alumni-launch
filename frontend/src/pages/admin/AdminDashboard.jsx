import { useEffect, useState } from 'react';
import api from '../../api/client';

const TABS = ['Overview', 'Students', 'Alumni', 'Companies', 'Startups', 'Jobs', 'Applications', 'Media'];

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
  const [expanded, setExpanded] = useState({}); // `${kind}:${id}` -> bool

  const toggleExpand = (kind, id) => {
    const key = `${kind}:${id}`;
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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
            <div key={s.id} className="card" style={{ padding: '14px 16px' }}>
              <div style={rowStyle}>
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
                  <button className="btn btn-ghost" onClick={() => toggleExpand('students', s.id)}>
                    {expanded[`students:${s.id}`] ? 'Hide details' : 'View details'}
                  </button>
                  <button className="btn btn-danger" disabled={actioning === s.id} onClick={() => deleteRecord('students', s.id, 'student')}>Delete</button>
                </div>
              </div>
              {expanded[`students:${s.id}`] && (
                <div style={detailPanelStyle}>
                  <DetailRow label="Full name" value={s.name} />
                  <DetailRow label="Email" value={s.email} />
                  <DetailRow label="Branch" value={s.branch} />
                  <DetailRow label="Year" value={s.year} />
                  <DetailRow label="Skills" value={s.skills} />
                  <DetailRow
                    label="Resume"
                    value={s.resume_url ? <a href={s.resume_url} target="_blank" rel="noreferrer">Open resume</a> : null}
                  />
                  <DetailRow label="Approval status" value={s.approval_status} />
                  <DetailRow label="Signed up" value={new Date(s.created_at).toLocaleString()} />
                </div>
              )}
            </div>
          ))}
        </List>
      )}

      {tab === 'Alumni' && (
        <List loading={!alumni} empty={alumni && alumni.length === 0} emptyText="No alumni yet.">
          {alumni?.map((a) => (
            <div key={a.id} className="card" style={{ padding: '14px 16px' }}>
              <div style={rowStyle}>
                <div>
                  <h3 style={{ fontSize: 16 }}>{a.name || 'Unnamed'}</h3>
                  <div style={metaStyle}>
                    {a.email} {a.company ? `· ${a.company}` : ''} {a.batch ? `· Batch ${a.batch}` : ''} · {a.is_claimed ? 'claimed' : 'imported, unclaimed'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-ghost" onClick={() => toggleExpand('alumni', a.id)}>
                    {expanded[`alumni:${a.id}`] ? 'Hide details' : 'View details'}
                  </button>
                  <button className="btn btn-danger" disabled={actioning === a.id} onClick={() => deleteRecord('alumni', a.id, 'alumnus')}>Delete</button>
                </div>
              </div>
              {expanded[`alumni:${a.id}`] && (
                <div style={detailPanelStyle}>
                  <DetailRow label="Name" value={a.name} />
                  <DetailRow label="Email" value={a.email} />
                  <DetailRow label="Batch" value={a.batch} />
                  <DetailRow label="Branch" value={a.branch} />
                  <DetailRow label="Current company" value={a.company} />
                  <DetailRow label="Designation" value={a.designation} />
                  <DetailRow label="Phone" value={a.phone} />
                  <DetailRow
                    label="LinkedIn"
                    value={a.linkedin_url ? <a href={a.linkedin_url} target="_blank" rel="noreferrer">{a.linkedin_url}</a> : null}
                  />
                  <DetailRow label="Account status" value={a.is_claimed ? 'Claimed (has logged in)' : 'Imported, never claimed'} />
                  <DetailRow label="Joined" value={new Date(a.created_at).toLocaleString()} />
                </div>
              )}
            </div>
          ))}
        </List>
      )}

      {tab === 'Companies' && (
        <List loading={!companies} empty={companies && companies.length === 0} emptyText="No companies yet.">
          {companies?.map((c) => (
            <div key={c.id} className="card" style={{ padding: '14px 16px' }}>
              <div style={rowStyle}>
                <div>
                  <h3 style={{ fontSize: 16 }}>{c.company_name}</h3>
                  <div style={metaStyle}>{c.industry || 'Industry not set'} {c.website ? `· ${c.website}` : ''}</div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-ghost" onClick={() => toggleExpand('companies', c.id)}>
                    {expanded[`companies:${c.id}`] ? 'Hide details' : 'View details'}
                  </button>
                  <button className="btn btn-danger" disabled={actioning === c.id} onClick={() => deleteRecord('companies', c.id, 'company')}>Delete</button>
                </div>
              </div>
              {expanded[`companies:${c.id}`] && (
                <div style={detailPanelStyle}>
                  <DetailRow label="Company name" value={c.company_name} />
                  <DetailRow label="Contact email" value={c.email} />
                  <DetailRow label="Website" value={c.website} />
                  <DetailRow label="Industry" value={c.industry} />
                  <DetailRow label="Description" value={c.description} />
                  <DetailRow label="Joined" value={new Date(c.created_at).toLocaleString()} />
                </div>
              )}
            </div>
          ))}
        </List>
      )}

      {tab === 'Startups' && (
        <List loading={!startups} empty={startups && startups.length === 0} emptyText="No startups posted yet.">
          {startups?.map((s) => (
            <div key={s.id} className="card" style={{ padding: '14px 16px' }}>
              <div style={rowStyle}>
                <div>
                  <h3 style={{ fontSize: 16 }}>{s.title}</h3>
                  <div style={metaStyle}>{s.domain || 'Domain not set'} · {s.stage || 'Stage not set'} · {s.is_active ? 'active' : 'inactive'}</div>
                </div>
                <button className="btn btn-ghost" onClick={() => toggleExpand('startups', s.id)}>
                  {expanded[`startups:${s.id}`] ? 'Hide details' : 'View details'}
                </button>
              </div>
              {expanded[`startups:${s.id}`] && (
                <div style={detailPanelStyle}>
                  <DetailRow label="Title" value={s.title} />
                  <DetailRow label="Domain" value={s.domain} />
                  <DetailRow label="Stage" value={s.stage} />
                  <DetailRow label="Description" value={s.description} />
                  <DetailRow label="Status" value={s.is_active ? 'Active' : 'Inactive'} />
                </div>
              )}
            </div>
          ))}
        </List>
      )}

      {tab === 'Jobs' && (
        <List loading={!jobs} empty={jobs && jobs.length === 0} emptyText="No jobs posted yet.">
          {jobs?.map((j) => (
            <div key={j.id} className="card" style={{ padding: '14px 16px' }}>
              <div style={rowStyle}>
                <div>
                  <h3 style={{ fontSize: 16 }}>{j.title}</h3>
                  <div style={metaStyle}>
                    {j.job_type} · {j.location || 'Location not set'} · posted by {j.posted_by_name || 'unknown'} ({j.posted_by_type}) · {j.is_active ? 'active' : 'inactive'}
                  </div>
                </div>
                <button className="btn btn-ghost" onClick={() => toggleExpand('jobs', j.id)}>
                  {expanded[`jobs:${j.id}`] ? 'Hide details' : 'View details'}
                </button>
              </div>
              {expanded[`jobs:${j.id}`] && (
                <div style={detailPanelStyle}>
                  <DetailRow label="Title" value={j.title} />
                  <DetailRow label="Type" value={j.job_type} />
                  <DetailRow label="Location" value={j.location} />
                  <DetailRow label="Description" value={j.description} />
                  <DetailRow label="Skills required" value={j.skills_required} />
                  <DetailRow label="Stipend / salary" value={j.stipend_or_salary} />
                  <DetailRow
                    label="Apply link"
                    value={j.apply_link ? <a href={j.apply_link} target="_blank" rel="noreferrer">{j.apply_link}</a> : null}
                  />
                  <DetailRow label="Posted by" value={j.posted_by_name ? `${j.posted_by_name} (${j.posted_by_type})` : null} />
                  <DetailRow label="Posted on" value={new Date(j.created_at).toLocaleString()} />
                </div>
              )}
            </div>
          ))}
        </List>
      )}

      {tab === 'Applications' && (
        <>
          <h3 style={{ fontSize: 15, margin: '4px 0 10px', color: 'var(--text-dim)' }}>Startup applications</h3>
          <List loading={!applications} empty={applications && applications.length === 0} emptyText="No startup applications yet.">
            {applications?.map((a) => (
              <div key={a.id} className="card" style={{ padding: '14px 16px' }}>
                <div style={rowStyle}>
                  <div>
                    <h3 style={{ fontSize: 15 }}>Application · {a.status}</h3>
                    <div style={metaStyle}>{a.message ? a.message.slice(0, 80) : 'No message'}</div>
                  </div>
                  <button className="btn btn-ghost" onClick={() => toggleExpand('applications', a.id)}>
                    {expanded[`applications:${a.id}`] ? 'Hide details' : 'View details'}
                  </button>
                </div>
                {expanded[`applications:${a.id}`] && (
                  <div style={detailPanelStyle}>
                    <DetailRow label="Status" value={a.status} />
                    <DetailRow label="Message" value={a.message} />
                    <DetailRow
                      label="Resume"
                      value={a.resume_url ? <a href={a.resume_url} target="_blank" rel="noreferrer">Open resume</a> : null}
                    />
                    <DetailRow label="Applied on" value={new Date(a.created_at).toLocaleString()} />
                  </div>
                )}
              </div>
            ))}
          </List>

          <h3 style={{ fontSize: 15, margin: '20px 0 10px', color: 'var(--text-dim)' }}>Job applications</h3>
          <List loading={!jobApplications} empty={jobApplications && jobApplications.length === 0} emptyText="No job applications yet.">
            {jobApplications?.map((a) => (
              <div key={a.id} className="card" style={{ padding: '14px 16px' }}>
                <div style={rowStyle}>
                  <div>
                    <h3 style={{ fontSize: 15 }}>Application · {a.status}</h3>
                    <div style={metaStyle}>{a.message ? a.message.slice(0, 80) : 'No message'}</div>
                  </div>
                  <button className="btn btn-ghost" onClick={() => toggleExpand('job-applications', a.id)}>
                    {expanded[`job-applications:${a.id}`] ? 'Hide details' : 'View details'}
                  </button>
                </div>
                {expanded[`job-applications:${a.id}`] && (
                  <div style={detailPanelStyle}>
                    <DetailRow label="Status" value={a.status} />
                    <DetailRow label="Message" value={a.message} />
                    <DetailRow
                      label="Resume"
                      value={a.resume_url ? <a href={a.resume_url} target="_blank" rel="noreferrer">Open resume</a> : null}
                    />
                    <DetailRow label="Applied on" value={new Date(a.created_at).toLocaleString()} />
                  </div>
                )}
              </div>
            ))}
          </List>
        </>
      )}

      {tab === 'Media' && <AdminMediaPanel />}
    </div>
  );
}

function mediaUrl(path) {
  if (!path) return path;
  return path.startsWith('http') ? path : `${api.defaults.baseURL}${path}`;
}

function AdminMediaPanel() {
  const [subTab, setSubTab] = useState('media');

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        <button
          className={subTab === 'media' ? 'btn btn-brass' : 'btn btn-ghost'}
          style={{ fontSize: 13, padding: '6px 14px' }}
          onClick={() => setSubTab('media')}
        >
          Media
        </button>
        <button
          className={subTab === 'sponsors' ? 'btn btn-brass' : 'btn btn-ghost'}
          style={{ fontSize: 13, padding: '6px 14px' }}
          onClick={() => setSubTab('sponsors')}
        >
          Sponsors
        </button>
      </div>
      {subTab === 'media' ? <MediaUploadPanel /> : <SponsorUploadPanel />}
    </div>
  );
}

function MediaUploadPanel() {
  const [items, setItems] = useState(null);
  const [title, setTitle] = useState('');
  const [mediaType, setMediaType] = useState('image');
  const [description, setDescription] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const load = () => api.get('/admin/media').then((res) => setItems(res.data)).catch(() => setItems([]));
  useEffect(() => { load(); }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !title.trim()) return;
    setUploading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('title', title);
      form.append('media_type', mediaType);
      form.append('file', file);
      if (description) form.append('description', description);
      if (linkUrl) form.append('link_url', linkUrl);
      await api.post('/admin/media', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setTitle('');
      setDescription('');
      setLinkUrl('');
      setFile(null);
      load();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    await api.delete(`/admin/media/${id}`);
    load();
  };

  return (
    <div>
      <h3 style={{ fontSize: 15, margin: '4px 0 10px', color: 'var(--text-dim)' }}>
        Upload video, image, or poster
      </h3>
      <form onSubmit={handleUpload} className="card" style={{ padding: 16, display: 'grid', gap: 10, maxWidth: 480, marginBottom: 24 }}>
        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <select value={mediaType} onChange={(e) => setMediaType(e.target.value)}>
          <option value="image">Image / Poster</option>
          <option value="video">Video</option>
        </select>
        <input
          type="file"
          accept={mediaType === 'video' ? 'video/*' : 'image/*'}
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          required
        />
        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
        <input
          placeholder="Website link (optional) — e.g. https://example.com"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
        />
        {error && <div className="error-banner">{error}</div>}
        <button className="btn btn-brass" type="submit" disabled={uploading}>
          {uploading ? 'Uploading…' : 'Upload'}
        </button>
      </form>

      <h3 style={{ fontSize: 15, margin: '4px 0 10px', color: 'var(--text-dim)' }}>Uploaded media</h3>
      <List loading={!items} empty={items && items.length === 0} emptyText="No media uploaded yet.">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
          {items?.map((m) => (
            <div key={m.id} className="card" style={{ padding: 10 }}>
              {m.media_type === 'video' ? (
                <video src={mediaUrl(m.file_url)} controls style={{ width: '100%', borderRadius: 6 }} />
              ) : (
                <img src={mediaUrl(m.file_url)} alt={m.title} style={{ width: '100%', borderRadius: 6, objectFit: 'cover', aspectRatio: '4/3' }} />
              )}
              <div style={{ fontSize: 13.5, marginTop: 6 }}>{m.title}</div>
              {m.description && <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>{m.description}</div>}
              {m.link_url && (
                <a href={m.link_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--brass)' }}>
                  Visit link
                </a>
              )}
              <button className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 10px', marginTop: 6, display: 'block' }} onClick={() => handleDelete(m.id)}>
                Delete
              </button>
            </div>
          ))}
        </div>
      </List>
    </div>
  );
}

function SponsorUploadPanel() {
  const [items, setItems] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [poster, setPoster] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const load = () => api.get('/admin/sponsors').then((res) => setItems(res.data)).catch(() => setItems([]));
  useEffect(() => { load(); }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!poster || !name.trim()) return;
    setUploading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('name', name);
      form.append('poster', poster);
      if (description) form.append('description', description);
      if (linkUrl) form.append('link_url', linkUrl);
      await api.post('/admin/sponsors', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setName('');
      setDescription('');
      setLinkUrl('');
      setPoster(null);
      load();
    } catch (err) {
      setError(err?.response?.data?.detail || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    await api.delete(`/admin/sponsors/${id}`);
    load();
  };

  return (
    <div>
      <h3 style={{ fontSize: 15, margin: '4px 0 10px', color: 'var(--text-dim)' }}>Add a sponsor</h3>
      <form onSubmit={handleUpload} className="card" style={{ padding: 16, display: 'grid', gap: 10, maxWidth: 480, marginBottom: 24 }}>
        <input placeholder="Sponsor name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input type="file" accept="image/*" onChange={(e) => setPoster(e.target.files?.[0] || null)} required />
        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
        <input
          placeholder="Website link (optional) — e.g. https://example.com"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
        />
        {error && <div className="error-banner">{error}</div>}
        <button className="btn btn-brass" type="submit" disabled={uploading}>
          {uploading ? 'Uploading…' : 'Add sponsor'}
        </button>
      </form>

      <h3 style={{ fontSize: 15, margin: '4px 0 10px', color: 'var(--text-dim)' }}>Sponsors</h3>
      <List loading={!items} empty={items && items.length === 0} emptyText="No sponsors yet.">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
          {items?.map((s) => (
            <div key={s.id} className="card" style={{ padding: 10 }}>
              <img src={mediaUrl(s.poster_url)} alt={s.name} style={{ width: '100%', borderRadius: 6, objectFit: 'cover', aspectRatio: '4/3' }} />
              <div style={{ fontSize: 13.5, marginTop: 6 }}>{s.name}</div>
              {s.description && <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>{s.description}</div>}
              {s.link_url && (
                <a href={s.link_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--brass)' }}>
                  Visit link
                </a>
              )}
              <button className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 10px', marginTop: 6, display: 'block' }} onClick={() => handleDelete(s.id)}>
                Delete
              </button>
            </div>
          ))}
        </div>
      </List>
    </div>
  );
}

// ---------- Shared styles & small helper components ----------

const rowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
};

const metaStyle = {
  color: 'var(--text-dim)',
  fontSize: 13,
  marginTop: 4,
};

const detailPanelStyle = {
  marginTop: 12,
  paddingTop: 12,
  borderTop: '1px solid var(--border, rgba(255,255,255,0.1))',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  gap: '6px 20px',
};

function DetailRow({ label, value }) {
  return (
    <div style={{ fontSize: 13.5 }}>
      <span style={{ color: 'var(--text-dim)' }}>{label}: </span>
      <span>{value || value === 0 ? value : '—'}</span>
    </div>
  );
}

function List({ loading, empty, emptyText, children }) {
  if (loading) return <p style={{ color: 'var(--text-dim)' }}>Loading…</p>;
  if (empty) return <p style={{ color: 'var(--text-dim)' }}>{emptyText}</p>;
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>;
}

function StatCard({ label, value, sub }) {
  return (
    <div className="card" style={{ padding: '16px 18px' }}>
      <div style={{ fontSize: 12.5, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 600, margin: '4px 0' }}>{value}</div>
      {sub && <div style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>{sub}</div>}
    </div>
  );
}
