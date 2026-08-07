import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import ProfileSummary from './ProfileSummary';

export default function Topbar() {
  const navigate = useNavigate();
  const { isAuthenticated, role, isAdmin, logout } = useAuth();
  const [logoPopped, setLogoPopped] = useState(false);

  return (
    <div className="topbar">
      <div className="topbar-icon-row" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="brand" onClick={() => setLogoPopped(true)} style={{ cursor: 'pointer' }}>
          <img src="/logo.png" alt="AlumniLaunch" className="brand-seal" style={{ objectFit: 'cover' }} />
          AlumniLaunch
        </div>
        {isAuthenticated && !isAdmin && <ProfileSummary />}
        {isAuthenticated && <NotificationBell />}
        {isAuthenticated && (
          <button
            onClick={() => { logout(); navigate('/'); }}
            aria-label="Log out"
            title="Log out"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 19, padding: '6px 4px', lineHeight: 1 }}
          >
            🚪
          </button>
        )}
      </div>
      <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {!isAuthenticated && (
          <>
            <button onClick={() => navigate('/startups')}>Browse startups</button>
            <button onClick={() => navigate('/login')}>Log in</button>
            <button className="btn btn-primary" onClick={() => navigate('/signup')}>
              Sign up
            </button>
          </>
        )}
        {isAuthenticated && !isAdmin && (
          <>
            <button onClick={() => navigate('/startups')}>Browse startups</button>
            <button onClick={() => { logout(); navigate('/'); }}>Log out</button>
          </>
        )}
        {isAuthenticated && isAdmin && (
          <>
            <button onClick={() => navigate('/admin/dashboard')}>Admin dashboard</button>
            <button onClick={() => { logout(); navigate('/'); }}>Log out</button>
          </>
        )}
      </div>

      {logoPopped && (
        <div
          onClick={() => setLogoPopped(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999,
            background: 'rgba(0,0,0,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'zoom-out',
            animation: 'logoBackdropIn 0.15s ease-out',
          }}
        >
          <img
            src="/logo.png"
            alt="AlumniLaunch"
            onClick={(e) => { e.stopPropagation(); navigate('/'); setLogoPopped(false); }}
            style={{
              width: 'min(260px, 60vw)',
              height: 'min(260px, 60vw)',
              objectFit: 'cover',
              borderRadius: '50%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              cursor: 'pointer',
              animation: 'logoPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          />
          <style>{`
            @keyframes logoPop {
              0%   { transform: scale(0.2); opacity: 0; }
              60%  { transform: scale(1.08); opacity: 1; }
              100% { transform: scale(1); opacity: 1; }
            }
            @keyframes logoBackdropIn {
              from { opacity: 0; }
              to   { opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
