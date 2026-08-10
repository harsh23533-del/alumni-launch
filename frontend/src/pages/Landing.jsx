import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import api from '../api/client';
import ReactionBar from '../components/ReactionBar';

const marqueeIconProps = { width: 26, height: 26, viewBox: '0 0 24 24', fill: 'none', stroke: 'white', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };

const marqueeIcons = [
  () => ( // rocket
    <svg {...marqueeIconProps}><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" /><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" /><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" /><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" /></svg>
  ),
  () => ( // laptop
    <svg {...marqueeIconProps}><rect x="3" y="4" width="18" height="12" rx="1.5" /><path d="M2 20h20" /></svg>
  ),
  () => ( // document / resume
    <svg {...marqueeIconProps}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M9 13h6M9 17h6" /></svg>
  ),
  () => ( // handshake
    <svg {...marqueeIconProps}><path d="M11 17l-1.6-1.6a2 2 0 0 0-2.8 0l-.3.3" /><path d="M2 12l4-4 4.5 4.5a1.5 1.5 0 0 1-2.12 2.12" /><path d="M22 12l-4-4-6 6" /><path d="M14.5 14.5l1.62 1.62a1.5 1.5 0 0 0 2.12-2.12" /></svg>
  ),
  () => ( // lightbulb
    <svg {...marqueeIconProps}><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.4 1 1.2 1 2.3h6c0-1.1.4-1.9 1-2.3A7 7 0 0 0 12 2z" /></svg>
  ),
  () => ( // graduation cap
    <svg {...marqueeIconProps}><path d="M22 10L12 5 2 10l10 5 10-5z" /><path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5" /></svg>
  ),
  () => ( // briefcase
    <svg {...marqueeIconProps}><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
  ),
];

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
          padding: 'clamp(90px, 20vw, 140px) 20px clamp(40px, 10vw, 64px)',
          textAlign: 'center',
          overflow: 'hidden',
          color: 'var(--paper)',
          background: '#0A0E14',
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
              objectFit: 'contain',
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
            background: 'linear-gradient(180deg, rgba(10,14,20,0.15) 0%, rgba(10,14,20,0.15) 70%, rgba(10,14,20,0.6) 100%)',
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
      </div>

      <div className="page" style={{ paddingTop: 0 }}>
        <div style={{ position: 'relative', margin: '32px 0', padding: '18px 0', overflow: 'hidden' }}>
          <div
            aria-hidden="true"
            className="marquee-mask"
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              zIndex: 0,
            }}
          >
            <div className="marquee-track">
              {[0, 1].map((dup) => (
                <div className="marquee-track-inner" key={dup}>
                  {marqueeIcons.map((Icon, i) => (
                    <Icon key={i} />
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-brass" style={{ padding: '9px 16px', fontSize: 12.5 }} onClick={() => navigate('/signup/alumni')}>
              I'm an alumnus — post a startup
            </button>
            <button
              className="btn btn-ghost"
              style={{ padding: '9px 16px', fontSize: 12.5 }}
              onClick={() => navigate('/signup/student')}
            >
              I'm a student — find a role
            </button>
          </div>
        </div>

        <MediaGallery />

        <AdminOathFooter />

        <FounderSection />

        <MembersOfAssociation />
      </div>
    </div>
  );
}

function mediaUrl2(path) {
  if (!path) return path;
  return path.startsWith('http') ? path : `${api.defaults.baseURL}${path}`;
}

function FounderSection() {
  const [photo, setPhoto] = useState(null);

  useEffect(() => {
    api.get('/admin/media/public').then((res) => {
      const match = res.data.find(
        (m) => m.media_type === 'image' && m.title && m.title.toLowerCase().includes('anil')
      );
      if (match) setPhoto(mediaUrl2(match.file_url));
    }).catch(() => {});
  }, []);

  return (
    <div style={{ marginTop: 56, textAlign: 'center' }}>
      {photo && (
        <img
          src={photo}
          alt="Prof. Anil Kumar"
          style={{
            width: 92,
            height: 92,
            borderRadius: '50%',
            objectFit: 'cover',
            margin: '0 auto 14px',
            border: '2px solid var(--brass)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}
        />
      )}
      <div style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        Under
      </div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 26,
          fontWeight: 700,
          marginTop: 4,
          background: 'linear-gradient(90deg, var(--coral), var(--amber), var(--brass-soft))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        Prof. Anil Kumar
      </div>
    </div>
  );
}

function MembersOfAssociation() {
  const members = [
    { name: 'sujeet yadav', url: 'https://www.linkedin.com/in/sujeet-yadav-6207b0288' },
    { name: 'Atul Singh', url: 'https://www.linkedin.com/in/atul-singh-560308265' },
    { name: 'deepak singh', url: 'https://www.linkedin.com/in/deepak-singh-a325762a4' },
  ];

  return (
    <div style={{ marginTop: 40, textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--brass)', marginBottom: 18 }}>
        Members of Association
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 360, margin: '0 auto' }}>
        {members.map((m) => (
          <a
            key={m.url}
            href={m.url}
            target="_blank"
            rel="noreferrer"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 17,
              padding: '12px 8px',
              color: 'var(--ink)',
              textDecoration: 'none',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'color 0.15s ease',
            }}
          >
            <span>{m.name}</span>
            <span style={{ fontSize: 13, opacity: 0.6 }}>🔗</span>
          </a>
        ))}
      </div>
    </div>
  );
}

function AdminOathFooter() {
  return (
    <div
      style={{
        marginTop: 56,
        borderRadius: 20,
        padding: '32px 24px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(45,212,191,0.14) 0%, rgba(232,201,118,0.14) 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '-80px',
          right: '-60px',
          width: 260,
          height: 260,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(45,212,191,0.25) 0%, rgba(45,212,191,0) 70%)',
          pointerEvents: 'none',
        }}
      />
      <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--brass)', marginBottom: 10 }}>
        Admin's Oath ❤️‍🩹
      </div>
      <p style={{ maxWidth: 560, margin: '0 auto', fontSize: 14, lineHeight: 1.7, color: 'var(--text-dim)' }}>
        As the Alumni Network Admin, I'm always open to supporting anyone who wants to work on an
        idea, startup, or initiative. I'll make my best efforts to help with websites, resources,
        connections, agents, or anything else you may need to get started.
      </p>
      <p style={{ fontSize: 13.5, marginTop: 14, color: 'var(--text-dim)' }}>Feel free to reach out anytime.</p>

      <div style={{ marginTop: 18, fontSize: 16, fontWeight: 700 }}>Harsh Pandey</div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 14, flexWrap: 'wrap' }}>
        <a
          href="https://www.linkedin.com/in/harsh-pandey-9a5219303"
          target="_blank"
          rel="noreferrer"
          className="btn btn-ghost"
          style={{ padding: '8px 16px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          🔗 LinkedIn
        </a>
        <a
          href="https://www.instagram.com/harshhhh452024/"
          target="_blank"
          rel="noreferrer"
          className="btn btn-ghost"
          style={{ padding: '8px 16px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          📸 Instagram
        </a>
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
    api.get('/admin/media/public')
      .then((res) => setItems(res.data.filter((m) => !(m.title && m.title.toLowerCase().includes('anil')))))
      .catch(() => setItems([]));
  }, []);

  if (items && items.length === 0) return null;

  return (
    <div style={{ marginTop: 56 }}>
      <h3 style={{ fontSize: 17, textAlign: 'center', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <span style={{ fontSize: 20 }}>🎓</span> From the campus
      </h3>
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
