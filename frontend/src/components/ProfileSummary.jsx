import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

function displayName(role, profile) {
  if (!profile) return '';
  if (role === 'company') return profile.company_name;
  return profile.name;
}

function roleLinks(role) {
  if (role === 'alumni') {
    return [
      { label: 'My startups', path: '/alumni/dashboard' },
      { label: 'Post a startup', path: '/alumni/post' },
      { label: 'My jobs', path: '/jobs/dashboard' },
      { label: 'Post a job', path: '/jobs/post' },
      { label: 'Ideas', path: '/ideas' },
      { label: 'Chat', path: '/chat' },
    ];
  }
  if (role === 'student') {
    return [
      { label: 'Jobs', path: '/jobs' },
      { label: 'Ideas', path: '/ideas' },
      { label: 'My applications', path: '/student/applications' },
      { label: 'Chat', path: '/chat' },
    ];
  }
  if (role === 'company') {
    return [
      { label: 'My jobs', path: '/jobs/dashboard' },
      { label: 'Post a job', path: '/jobs/post' },
      { label: 'Ideas', path: '/ideas' },
      { label: 'Chat', path: '/chat' },
    ];
  }
  return [];
}

export default function ProfileSummary() {
  const { role, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    api.get('/profiles/me').then((res) => setProfile(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const name = displayName(role, profile);
  const initial = name ? name.trim()[0].toUpperCase() : '?';

  return (
    <div ref={boxRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        title={name}
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'var(--brass)',
          color: '#1a1a1a',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        {initial}
      </button>

      {open && (
        <div
          className="card"
          style={{
            position: 'absolute',
            right: 0,
            top: 40,
            minWidth: 200,
            zIndex: 50,
            padding: 14,
          }}
        >
          <p style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 2 }}>{name || 'My profile'}</p>
          <p style={{ color: 'var(--text-dim)', fontSize: 12.5, textTransform: 'capitalize', marginBottom: 12 }}>
            {role}
          </p>
          <button
            className="btn btn-ghost"
            style={{ width: '100%', marginBottom: 8 }}
            onClick={() => { setOpen(false); navigate('/profile'); }}
          >
            My profile
          </button>
          <button
            className="btn btn-ghost"
            style={{ width: '100%', marginBottom: 8 }}
            onClick={() => { setOpen(false); navigate('/messages'); }}
          >
            Messages
          </button>
          {roleLinks(role).map((l) => (
            <button
              key={l.path}
              className="btn btn-ghost"
              style={{ width: '100%', marginBottom: 8 }}
              onClick={() => { setOpen(false); navigate(l.path); }}
            >
              {l.label}
            </button>
          ))}
          <button
            className="btn btn-ghost"
            style={{ width: '100%' }}
            onClick={() => { setOpen(false); logout(); navigate('/'); }}
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
