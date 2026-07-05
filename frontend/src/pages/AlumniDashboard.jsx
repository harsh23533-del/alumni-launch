import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import Seal from '../components/Seal';

export default function AlumniDashboard() {
  const navigate = useNavigate();
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [actionError, setActionError] = useState('');

  const loadStartups = async () => {
    setLoading(true);
    const res = await api.get('/startups/mine');
    setStartups(res.data);
    setLoading(false);
  };

  useEffect(() => { loadStartups(); }, []);

  const toggleApplicants = async (startupId) => {
    if (expanded === startupId) {
      setExpanded(null);
      return;
    }
    setExpanded(startupId);
    setLoadingApplicants(true);
    const res = await api.get(`/applications/for-startup/${startupId}`);
    setApplicants(res.data);
    setLoadingApplicants(false);
  };

  const updateStatus = async (applicationId, status) => {
    setActionError('');
    try {
      await api.patch(`/applications/${applicationId}/status`, { status });
      setApplicants((prev) => prev.map((a) => (a.id === applicationId ? { ...a, status } : a)));
    } catch (err) {
      setActionError(err.response?.data?.detail || 'Could not update this application.');
    }
  };

  const closeStartup = async (startupId) => {
    await api.patch(`/startups/${startupId}/close`);
    loadStartups();
  };

  return (
    <div className="page" style={{ paddingTop: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 26 }}>My startups</h2>
        <button className="btn btn-brass" onClick={() => navigate('/alumni/post')}>+ Post a startup</button>
      </div>

      {loading && <p style={{ color: 'var(--text-dim)' }}>Loading…</p>}

      {!loading && startups.length === 0 && (
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-dim)', marginBottom: 14 }}>You haven't posted a startup yet.</p>
          <button className="btn btn-brass" onClick={() => navigate('/alumni/post')}>Post your first startup</button>
        </div>
      )}

      {startups.map((s) => (
        <div key={s.id} className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--brass)' }}>
                {s.domain || 'General'} · {s.stage || 'Idea stage'}
              </div>
              <h3 style={{ fontSize: 21, marginTop: 6 }}>{s.title}</h3>
            </div>
            <Seal status={s.is_active ? 'open' : 'closed'} />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button className="btn btn-ghost" onClick={() => toggleApplicants(s.id)}>
              {expanded === s.id ? 'Hide applicants' : 'View applicants'}
            </button>
            {s.is_active && (
              <button className="btn btn-danger" onClick={() => closeStartup(s.id)}>Close posting</button>
            )}
          </div>

          {expanded === s.id && (
            <div style={{ marginTop: 20, borderTop: '1px solid var(--line)', paddingTop: 18 }}>
              {actionError && <div className="error-banner">{actionError}</div>}
              {loadingApplicants && <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>Loading applicants…</p>}
              {!loadingApplicants && applicants.length === 0 && (
                <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>No applications yet for this startup.</p>
              )}
              {!loadingApplicants && applicants.map((a) => (
                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--line)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                      <Seal status={a.status} />
                      {a.resume_url && (
                        <a href={`${api.defaults.baseURL}/${a.resume_url}`} target="_blank" rel="noreferrer" style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', textDecoration: 'underline' }}>
                          View resume
                        </a>
                      )}
                    </div>
                    <p style={{ fontSize: 14, color: 'var(--text-dim)' }}>{a.message || 'No message provided.'}</p>
                  </div>
                  {a.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button className="btn btn-ghost" onClick={() => updateStatus(a.id, 'rejected')}>Decline</button>
                      <button className="btn btn-brass" onClick={() => updateStatus(a.id, 'accepted')}>Accept</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
