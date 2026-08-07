import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import ProfileSummary from './ProfileSummary';
import { navIcons, buildTabs } from './MobileBottomNav';

export default function Topbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, role, isAdmin, logout } = useAuth();
  const [logoPopped, setLogoPopped] = useState(false);
  const desktopTabs = buildTabs({ isAuthenticated, role, isAdmin }).filter((t) => !t.action);

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
      <div className="desktop-icon-nav" role="navigation" aria-label="Main">
        {desktopTabs.map((tab) => {
          const isActive = tab.path === '/' ? location.pathname === '/' : location.pathname.startsWith(tab.path);
          return (
            <button
              key={tab.id}
              title={tab.label}
              aria-label={tab.label}
              className={isActive ? 'desktop-icon-nav-active' : ''}
              onClick={() => navigate(tab.path)}
            >
              {navIcons[tab.icon]}
            </button>
          );
        })}
      </div>
      <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {!isAuthenticated && (
          <button className="btn btn-primary" onClick={() => navigate('/signup')}>
            Sign up
          </button>
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
