import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import api from '../api/client';
import ReactionBar from '../components/ReactionBar';

export default function Landing() {
  const navigate = useNavigate();
  const [heroVideoUrl, setHeroVideoUrl] = useState(null);
  usePageTitle('Home', 'Where alumni startups find their first hires. Browse startups and jobs posted by alumni and companies, and apply directly with your resume.');

  useEffect(() => {
    api.get('/admin/homepage-video/public').then((res) => setHeroVideoUrl(res.data.video_url)).catch(() => {});
  }, []);

  return (
    <div className="page" style={{ maxWidth: 'none', padding: 0 }}>
      <div
        style={{
          position: 'relative',
          padding: 'clamp(56px, 14vw, 96px) 20px clamp(40px, 10vw, 64px)',
          textAlign: 'center',
          overflow: 'hidden',
          color: 'var(--paper)',
        }}
      >
        {heroVideoUrl ? (
          <video
            src={heroVideoUrl}
            autoPlay
            loop
            muted
            playsInline
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 0,
            }}
          />
        ) : (
          <img
            src="/images/hero-campus.webp"
            alt=""
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 0,
            }}
          />
        )}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(22,33,62,0.82) 0%, rgba(22,33,62,0.9) 55%, rgba(22,33,62,0.97) 100%)',
            zIndex: 1,
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '-120px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 560,
            height: 560,
            background: 'radial-gradient(circle, rgba(232,201,118,0.22) 0%, rgba(232,201,118,0) 70%)',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: 900, margin: '0 auto' }}>
          <div className="rise-in rise-in-3" style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 32, flexWrap: 'wrap' }}>
            <button className="btn btn-brass" style={{ padding: '13px 22px', fontSize: 15 }} onClick={() => navigate('/signup/alumni')}>
              I'm an alumnus — post a startup
            </button>
            <button
              className="btn"
              style={{ padding: '13px 22px', fontSize: 15, background: 'rgba(255,255,255,0.08)', color: 'var(--paper)', border: '1px solid rgba(255,255,255,0.35)' }}
              onClick={() => navigate('/signup/student')}
            >
              I'm a student — find a role
            </button>
          </div>
        </div>
      </div>

      <div className="page" style={{ paddingTop: 0 }}>
        <div style={{ textAlign: 'center', margin: '40px 0' }}>
          <button className="btn btn-ghost" onClick={() => navigate('/startups')}>
            Browse open startups without an account →
          </button>
        </div>

        <MediaGallery />
      </div>
    </div>
  );
}

function mediaUrl(path) {
  if (!path) return path;
  return path.startsWith('http') ? path : `${api.defaults.baseURL}${path}`;
}

function MediaGallery() {
  const [items, setItems] = useState(null);

  useEffect(() => {
    api.get('/admin/media/public').then((res) => setItems(res.data)).catch(() => setItems([]));
  }, []);

  if (items && items.length === 0) return null;

  return (
    <div style={{ marginTop: 56 }}>
      <h3 style={{ fontSize: 20, textAlign: 'center', marginBottom: 20 }}>From the campus</h3>
      <div
        style={{
          display: 'flex',
          gap: 18,
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          padding: '4px 4px 16px',
          scrollbarWidth: 'none',
        }}
      >
        {items?.map((m) => (
          <div
            key={m.id}
            style={{
              position: 'relative',
              flex: '0 0 220px',
              aspectRatio: '3 / 4',
              borderRadius: 14,
              overflow: 'hidden',
              scrollSnapAlign: 'start',
              boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
              border: '1px solid var(--line, rgba(255,255,255,0.08))',
              background: '#0d0d14',
            }}
          >
            {m.media_type === 'video' ? (
              <video
                src={mediaUrl(m.file_url)}
                controls
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <img
                src={mediaUrl(m.file_url)}
                alt={m.title}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )}

            {m.media_type === 'video' && (
              <span
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  background: 'rgba(0,0,0,0.55)',
                  color: '#fff',
                  fontSize: 10.5,
                  fontWeight: 600,
                  letterSpacing: 0.4,
                  padding: '3px 8px',
                  borderRadius: 20,
                  pointerEvents: 'none',
                }}
              >
                VIDEO
              </span>
            )}

            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                padding: '28px 12px 10px',
                background: 'linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0))',
                pointerEvents: 'none',
              }}
            >
              <div style={{ color: '#fff', fontSize: 13.5, fontWeight: 600, lineHeight: 1.3, marginBottom: 6 }}>{m.title}</div>
              <div style={{ pointerEvents: 'auto', color: '#fff' }}>
                <ReactionBar targetType="media" targetId={m.id} />
              </div>
            </div>
          </div>
        ))}
        {!items && <p style={{ color: 'var(--text-dim)', textAlign: 'center' }}>Loading…</p>}
      </div>
    </div>
  );
}
