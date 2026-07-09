import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import Seal from '../components/Seal';

export default function StudentApplications() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [startupsById, setStartupsById] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const appsRes = await api.get('/applications/mine');
      setApplications(appsRes.data);

      const uniqueStartupIds = [...new Set(appsRes.data.map((a) => a.startup_id))];
      const startupResults = await Promise.all(
        uniqueStartupIds.map((id) => api.get(`/startups/${id}`).then((r) => r.data).catch(() => null))
      );
      const map = {};
      startupResults.forEach((s) => { if (s) map[s.id] = s; });
      setStartupsById(map);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="page" style={{ paddingTop: 32 }}>
      <h2 style={{ fontSize: 26, marginBottom: 24 }}>My applications</h2>

      {loading && <p style={{ color: 'var(--text-dim)' }}>Loading…</p>}

      {!loading && applications.length === 0 && (
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-dim)', marginBottom: 14 }}>You haven't applied to any startups yet.</p>
          <button className="btn btn-brass" onClick={() => navigate('/startups')}>Browse open startups</button>
        </div>
      )}

      {applications.map((a) => {
        const startup = startupsById[a.startup_id];
        return (
          <div key={a.id} className="card" style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <h3 style={{ fontSize: 19 }}>{startup ? startup.title : 'Startup'}</h3>
              <Seal status={a.status} />
            </div>
            {startup?.domain && (
              <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 4 }}>{startup.domain}</div>
            )}
            <p style={{ fontSize: 14, color: 'var(--text-dim)', marginTop: 10 }}>{a.message}</p>
          </div>
        );
      })}
    </div>
  );
}
