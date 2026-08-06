import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import usePageTitle from '../hooks/usePageTitle';

function Row({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 15 }}>{value}</div>
    </div>
  );
}

export default function Profile() {
  const { role } = useAuth();
  usePageTitle('My profile', 'Your AlumniLaunch profile details.');
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    api.get('/profiles/me').then((res) => setProfile(res.data)).catch(() => {});
  }, []);

  if (!profile) return <div className="page" style={{ paddingTop: 32 }}><p style={{ color: 'var(--text-dim)' }}>Loading…</p></div>;

  return (
    <div className="page" style={{ paddingTop: 32, maxWidth: 560 }}>
      <h2 style={{ fontSize: 26, marginBottom: 20 }}>My profile</h2>
      <div className="card" style={{ padding: 22 }}>
        {role === 'student' && (
          <>
            <Row label="Name" value={profile.name} />
            <Row label="Branch" value={profile.branch} />
            <Row label="Year" value={profile.year} />
            <Row label="Skills" value={profile.skills} />
            <Row label="Approval status" value={profile.approval_status} />
            {profile.resume_url && (
              <div style={{ marginTop: 4 }}>
                <a
                  href={profile.resume_url.startsWith('http') ? profile.resume_url : `${api.defaults.baseURL}/${profile.resume_url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-ghost"
                  style={{ fontSize: 13 }}
                >
                  View resume
                </a>
              </div>
            )}
          </>
        )}
        {role === 'alumni' && (
          <>
            <Row label="Name" value={profile.name} />
            <Row label="Email" value={profile.email} />
            <Row label="Batch" value={profile.batch} />
            <Row label="Branch" value={profile.branch} />
            <Row label="Company" value={profile.company} />
            <Row label="Designation" value={profile.designation} />
            {profile.linkedin_url && (
              <div style={{ marginTop: 4 }}>
                <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ fontSize: 13 }}>
                  View LinkedIn
                </a>
              </div>
            )}
          </>
        )}
        {role === 'company' && (
          <>
            <Row label="Company name" value={profile.company_name} />
            <Row label="Industry" value={profile.industry} />
            <Row label="Description" value={profile.description} />
            {profile.website && (
              <div style={{ marginTop: 4 }}>
                <a href={profile.website} target="_blank" rel="noreferrer" className="btn btn-ghost" style={{ fontSize: 13 }}>
                  Visit website
                </a>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
