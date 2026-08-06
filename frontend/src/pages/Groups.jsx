import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import api from '../api/client';

export default function Groups() {
  usePageTitle('Groups', 'Teams formed around student ideas on AlumniLaunch.');
  const navigate = useNavigate();
  const [groups, setGroups] = useState(null);

  useEffect(() => {
    api.get('/ideas/groups/all').then((res) => setGroups(res.data)).catch(() => setGroups([]));
  }, []);

  return (
    <div className="page" style={{ paddingTop: 32 }}>
      <h2 style={{ fontSize: 26, marginBottom: 6 }}>Groups</h2>
      <p style={{ color: 'var(--text-dim)', marginBottom: 24 }}>
        Teams that have formed around student ideas across AlumniLaunch.
      </p>

      {groups === null && <p style={{ color: 'var(--text-dim)' }}>Loading…</p>}
      {groups && groups.length === 0 && (
        <p style={{ color: 'var(--text-dim)' }}>No groups yet — groups appear here once an idea owner accepts a join request.</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 18 }}>
        {groups?.map((g) => (
          <div
            key={g.id}
            className="card"
            style={{ padding: 16, cursor: 'pointer' }}
            onClick={() => navigate('/ideas')}
          >
            {g.poster_url && (
              <img
                src={g.poster_url}
                alt={g.title}
                style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 8, marginBottom: 10 }}
              />
            )}
            <h3 style={{ fontSize: 15.5, marginBottom: 4 }}>{g.title}</h3>
            <p style={{ fontSize: 12.5, color: 'var(--text-dim)', marginBottom: 8 }}>
              Started by {g.student_name || 'a student'}
            </p>
            <span className="seal seal-open">{g.member_count} member{g.member_count === 1 ? '' : 's'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
