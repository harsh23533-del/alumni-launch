import { useEffect, useState } from 'react';
import usePageTitle from '../hooks/usePageTitle';
import api from '../api/client';

export default function Sponsors() {
  usePageTitle('Sponsors', 'Organizations supporting AlumniLaunch.');
  const [sponsors, setSponsors] = useState(null);

  useEffect(() => {
    api.get('/admin/sponsors/public').then((res) => setSponsors(res.data)).catch(() => setSponsors([]));
  }, []);

  return (
    <div className="page" style={{ paddingTop: 32 }}>
      <h2 style={{ fontSize: 26, marginBottom: 6 }}>Our sponsors</h2>
      <p style={{ color: 'var(--text-dim)', marginBottom: 24 }}>
        Organizations supporting the AlumniLaunch community.
      </p>

      {sponsors === null && <p style={{ color: 'var(--text-dim)' }}>Loading…</p>}
      {sponsors && sponsors.length === 0 && <p style={{ color: 'var(--text-dim)' }}>No sponsors yet.</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 18 }}>
        {sponsors?.map((s) => (
          <div key={s.id} className="card" style={{ padding: 14 }}>
            <img
              src={s.poster_url}
              alt={s.name}
              style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 8, marginBottom: 10 }}
            />
            <h3 style={{ fontSize: 15.5, marginBottom: 4 }}>{s.name}</h3>
            {s.description && (
              <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 10 }}>{s.description}</p>
            )}
            {s.link_url && (
              <a
                href={s.link_url}
                target="_blank"
                rel="noreferrer"
                className="btn btn-ghost"
                style={{ display: 'inline-block', fontSize: 12.5, padding: '6px 12px' }}
              >
                Visit website
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
